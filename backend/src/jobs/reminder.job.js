import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import { notifyUsers } from '../services/notification.service.js';
import { sendMail } from '../services/mail.service.js';
import { addDays, toDateStr } from '../utils/time.js';
import { callTimes } from '../utils/callWindow.js';

/** Reminds patients about approved appointments happening tomorrow. Safe to run repeatedly. */
export async function sendTomorrowReminders() {
  const tomorrow = addDays(toDateStr(), 1);
  const list = await Appointment.find({ date: tomorrow, status: 'Approved', reminderSent: false })
    .populate('doctor', 'fullName specialization')
    .populate('patient', 'fullName email');

  for (const a of list) {
    const when = `${a.date} at ${a.startTime}`;
    await notifyUsers([a.patient._id], {
      type: 'reminder',
      title: 'Appointment tomorrow',
      message: a.mode === 'Video'
        ? `Video call with ${a.doctor.fullName} on ${when}. You can join 10 minutes early from this page.`
        : `With ${a.doctor.fullName} on ${when}. Please arrive 10 minutes early.`,
      link: `/app/appointments/${a._id}`,
    });
    await sendMail({
      to: a.patient.email,
      subject: 'Reminder: your appointment tomorrow',
      title: 'See you tomorrow',
      html: `<p>Hi ${a.patient.fullName},</p><p>This is a reminder of your appointment with <b>${a.doctor.fullName}</b> (${a.doctor.specialization}) on <b>${when}</b>.</p><p>If you can't make it, please cancel from your dashboard so someone else can use the slot.</p>`,
    });
    a.reminderSent = true;
    await a.save();
  }
  if (list.length) console.log(`Sent ${list.length} appointment reminder(s) for ${tomorrow}`);
  return list.length;
}

/**
 * Video visits get two extra reminders on the day:
 *  - 1 hour before: "check your camera and microphone"
 *  - 10 minutes before: "the call is open, join now" (to both patient and doctor)
 */
export async function sendVideoCallReminders(now = new Date()) {
  const list = await Appointment.find({
    mode: 'Video', status: 'Approved', date: toDateStr(now), $or: [{ reminder1hSent: false }, { reminder10mSent: false }],
  }).populate('doctor', 'fullName').populate('patient', 'fullName email');

  let sent = 0;
  for (const a of list) {
    const t = callTimes(a);
    const link = `/app/call/${a._id}`;
    if (!a.reminder10mSent && now >= t.opensAt && now < t.endAt) {
      await notifyUsers([a.patient._id], { type: 'call', title: 'Your video call is open', message: `Join now. ${a.doctor.fullName} will admit you at ${a.startTime}.`, link });
      await notifyUsers([a.doctor._id], { type: 'call', title: 'Video call opening', message: `${a.patient.fullName} at ${a.startTime}. You can start 5 minutes early.`, link });
      a.reminder10mSent = true;
      a.reminder1hSent = true;
      sent += 1;
    } else if (!a.reminder1hSent && now >= new Date(t.startAt - 60 * 60 * 1000) && now < t.opensAt) {
      await notifyUsers([a.patient._id], { type: 'call', title: 'Video call in 1 hour', message: `With ${a.doctor.fullName} at ${a.startTime}. Please check your camera, microphone and internet.`, link });
      await sendMail({
        to: a.patient.email,
        subject: 'Your video consultation starts in 1 hour',
        title: 'Video call in 1 hour',
        html: `<p>Hi ${a.patient.fullName},</p><p>Your video consultation with <b>${a.doctor.fullName}</b> starts at <b>${a.startTime}</b> today.</p><p>Please sit somewhere quiet and private, and check your camera, microphone and internet. You can join the waiting room 10 minutes before the start time.</p>`,
      });
      a.reminder1hSent = true;
      sent += 1;
    } else {
      continue;
    }
    await a.save();
  }
  return sent;
}

/** Runs every day at 08:00 (server time), plus once at startup to catch up. Video reminders run every minute. */
export function startReminderJob() {
  cron.schedule('0 8 * * *', () => sendTomorrowReminders().catch((e) => console.error('reminder job:', e.message)));
  sendTomorrowReminders().catch((e) => console.error('reminder job:', e.message));
  cron.schedule('* * * * *', () => sendVideoCallReminders().catch((e) => console.error('video reminder job:', e.message)));
}
