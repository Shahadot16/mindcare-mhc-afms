// Video consultation: Socket.io is the signaling channel for WebRTC.
// Audio and video travel directly between the two browsers (peer-to-peer) and never touch this server.
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import { notifyUsers } from './notification.service.js';
import { callTimes, joinState } from '../utils/callWindow.js';

const room = (id) => `call:${id}`;

// Who is connected to each call right now: appointmentId -> { doctor: Set<socketId>, patient: Set<socketId> }
const presence = new Map();

function addPresence(id, who, socketId) {
  if (!presence.has(id)) presence.set(id, { doctor: new Set(), patient: new Set() });
  presence.get(id)[who].add(socketId);
}
function removePresence(id, who, socketId) {
  const p = presence.get(id);
  if (!p) return;
  p[who].delete(socketId);
  if (!p.doctor.size && !p.patient.size) presence.delete(id);
}
export function isPresent(id, who) {
  return Boolean(presence.get(String(id))?.[who]?.size);
}

function stateOf(id, appt) {
  return {
    doctorPresent: isPresent(id, 'doctor'),
    patientPresent: isPresent(id, 'patient'),
    admitted: Boolean(appt?.call?.startedAt),
    startedAt: appt?.call?.startedAt || null,
    endedAt: appt?.call?.endedAt || null,
  };
}

async function broadcastState(io, id, appt) {
  const a = appt || (await Appointment.findById(id).select('call'));
  io.to(room(id)).emit('call:state', stateOf(id, a));
}

/** Ends a call, saves its duration and tells everyone in the room. */
export async function endCall(io, appt, endedBy) {
  if (appt.call?.endedAt) return;
  const now = new Date();
  appt.call.endedAt = now;
  appt.call.endedBy = endedBy;
  appt.call.durationSec = appt.call.startedAt ? Math.round((now - appt.call.startedAt) / 1000) : 0;
  await appt.save();
  io?.to(room(appt._id)).emit('call:ended', { by: endedBy, durationSec: appt.call.durationSec });
}

/** Tells the waiting room that the appointment was cancelled (e.g. no-show), so the page can close. */
export function emitCallClosed(io, id, reason) {
  io?.to(room(id)).emit('call:ended', { by: reason, durationSec: 0 });
}

export function registerCallHandlers(io, socket) {
  const me = socket.user;
  const joined = new Map(); // appointmentId -> 'doctor' | 'patient'

  const sideOf = (appt) => {
    if (String(appt.doctor) === String(me._id)) return 'doctor';
    if (String(appt.patient) === String(me._id)) return 'patient';
    return null;
  };
  const load = (id) => (mongoose.isValidObjectId(id) ? Appointment.findById(id) : null);
  const safeAck = (ack) => (typeof ack === 'function' ? ack : () => {});

  socket.on('call:join', async ({ id } = {}, ack) => {
    const reply = safeAck(ack);
    try {
      const appt = await load(id);
      if (!appt) return reply({ ok: false, reason: 'Appointment not found' });
      const who = sideOf(appt);
      if (!who) return reply({ ok: false, reason: 'This is not your appointment' });
      const s = joinState(appt);
      if (!s.ok) return reply({ ok: false, reason: s.reason, phase: s.phase });

      socket.join(room(id));
      joined.set(String(id), who);
      addPresence(String(id), who, socket.id);

      if (who === 'patient' && !appt.call?.patientJoinedAt) {
        appt.call.patientJoinedAt = new Date();
        await appt.save();
        await notifyUsers([appt.doctor], {
          type: 'call', title: 'Patient is in the waiting room',
          message: `${me.fullName} is waiting for the video call`, link: `/app/call/${id}`,
        });
      }
      socket.to(room(id)).emit('call:peer-joined', { who });
      await broadcastState(io, String(id), appt);
      return reply({ ok: true, who, admitted: Boolean(appt.call?.startedAt) });
    } catch (err) {
      console.error('call:join', err.message);
      return reply({ ok: false, reason: 'Could not join the call' });
    }
  });

  // Doctor lets the patient in. Allowed from 5 minutes before the start time.
  socket.on('call:admit', async ({ id } = {}, ack) => {
    const reply = safeAck(ack);
    try {
      if (joined.get(String(id)) !== 'doctor') return reply({ ok: false, reason: 'Only the doctor can start the call' });
      const appt = await load(id);
      const s = joinState(appt);
      if (!s.ok) return reply({ ok: false, reason: s.reason });
      if (new Date() < callTimes(appt).canAdmitAt) return reply({ ok: false, reason: 'You can start the call 5 minutes before the appointment time' });
      if (!isPresent(String(id), 'patient')) return reply({ ok: false, reason: 'The patient is not in the waiting room yet' });
      if (!appt.call.startedAt) {
        appt.call.startedAt = new Date();
        await appt.save();
      }
      io.to(room(id)).emit('call:admitted', { startedAt: appt.call.startedAt });
      await broadcastState(io, String(id), appt);
      return reply({ ok: true });
    } catch (err) {
      console.error('call:admit', err.message);
      return reply({ ok: false, reason: 'Could not start the call' });
    }
  });

  // The patient's camera/mic are ready: the doctor's browser then sends a WebRTC offer
  socket.on('call:ready', ({ id } = {}) => {
    if (joined.get(String(id)) === 'patient') socket.to(room(id)).emit('call:peer-ready');
  });

  // WebRTC offer / answer / ICE candidates, relayed to the other person in the call
  socket.on('call:signal', ({ id, data } = {}) => {
    const who = joined.get(String(id));
    if (!who || !data) return;
    socket.to(room(id)).emit('call:signal', { from: who, data });
  });

  socket.on('call:end', async ({ id } = {}, ack) => {
    const reply = safeAck(ack);
    if (joined.get(String(id)) !== 'doctor') return reply({ ok: false, reason: 'Only the doctor can end the call' });
    const appt = await load(id);
    if (appt) await endCall(io, appt, 'Doctor');
    return reply({ ok: true });
  });

  const leave = async (id) => {
    const who = joined.get(id);
    if (!who) return;
    joined.delete(id);
    socket.leave(room(id));
    removePresence(id, who, socket.id);
    if (!isPresent(id, who)) socket.to(room(id)).emit('call:peer-left', { who });
    await broadcastState(io, id).catch(() => {});
  };

  socket.on('call:leave', ({ id } = {}) => leave(String(id)));
  socket.on('disconnect', () => {
    for (const id of [...joined.keys()]) leave(id);
  });
}

/** Every minute: close calls whose time (slot end + 10 minutes grace) has run out. */
export function startCallSweeper(io) {
  const timer = setInterval(async () => {
    try {
      const open = await Appointment.find({ mode: 'Video', 'call.startedAt': { $ne: null }, 'call.endedAt': null });
      const now = new Date();
      for (const appt of open) {
        if (now > callTimes(appt).closesAt) await endCall(io, appt, 'Time limit');
      }
    } catch (err) {
      console.error('call sweeper:', err.message);
    }
  }, 60 * 1000);
  timer.unref();
}
