import Appointment from '../models/Appointment.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { CALL_RULES, callTimes, iceServers, joinState } from '../utils/callWindow.js';
import { emitCallClosed, isPresent } from '../services/call.service.js';
import { getIO } from '../services/socket.service.js';
import { notifyRoles, notifyUsers } from '../services/notification.service.js';
import { audit } from '../services/audit.service.js';

async function loadOwn(req) {
  const appt = await Appointment.findById(req.params.id)
    .populate('doctor', 'fullName specialization')
    .populate('patient', 'fullName contactNumber age gender');
  if (!appt) throw notFound('Appointment not found');
  const mine = req.user.role === 'Doctor' ? String(appt.doctor._id) === String(req.user._id)
    : req.user.role === 'Patient' ? String(appt.patient._id) === String(req.user._id) : false;
  if (!mine) throw forbidden('Only the doctor and patient of this appointment can join its call');
  return appt;
}

// GET /api/calls/:id  — everything the call page needs: timing, state and ICE servers
export async function getCall(req, res) {
  const appt = await loadOwn(req);
  const id = String(appt._id);
  res.json({
    appointment: appt,
    role: req.user.role,
    serverNow: new Date(),
    times: appt.mode === 'Video' ? callTimes(appt) : null,
    rules: CALL_RULES,
    state: joinState(appt),
    presence: { doctor: isPresent(id, 'doctor'), patient: isPresent(id, 'patient') },
    iceServers: iceServers(),
  });
}

// POST /api/calls/:id/no-show  (Doctor) — patient did not come 10+ minutes after the start time
export async function markNoShow(req, res) {
  const appt = await loadOwn(req);
  if (req.user.role !== 'Doctor') throw forbidden();
  if (appt.mode !== 'Video' || appt.status !== 'Approved') throw badRequest('Only an approved video appointment can be marked as a no-show');
  if (appt.call?.startedAt) throw badRequest('The call already took place');
  if (new Date() < callTimes(appt).noShowAt) throw badRequest(`You can mark a no-show ${CALL_RULES.noShowAfterMin} minutes after the start time`);
  if (isPresent(appt._id, 'patient')) throw badRequest('The patient is in the waiting room. Please admit them.');

  appt.status = 'Cancelled';
  appt.holdsSlot = false;
  appt.cancelledBy = 'No-show';
  await appt.save();
  emitCallClosed(getIO(), appt._id, 'No-show');
  await notifyUsers([appt.patient._id], {
    type: 'appointment', priority: 'high', title: 'Missed video appointment',
    message: `You did not join your video call with ${appt.doctor.fullName}. Please book a new appointment.`, link: '/app/doctors',
  });
  await notifyRoles(['Staff'], { type: 'appointment', title: 'Video visit no-show', message: `${appt.patient.fullName} with ${appt.doctor.fullName}, ${appt.date} ${appt.startTime}`, link: '/app/appointments' });
  await audit(req, 'call.no-show', { entity: 'Appointment', entityId: appt._id, summary: `${appt.patient.fullName}, ${appt.date} ${appt.startTime}` });
  res.json(appt);
}
