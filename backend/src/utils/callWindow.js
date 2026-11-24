// Timing rules for video consultations. All times use the server clock (Bangladesh time),
// never the user's device clock.

export const CALL_RULES = {
  joinBeforeMin: 10, // patient can enter the waiting room 10 minutes early
  doctorEarlyMin: 5, // doctor can admit and start up to 5 minutes early
  warnBeforeEndMin: 5, // doctor sees a "5 minutes left" warning
  graceMin: 10, // call closes 10 minutes after the slot ends
  noShowAfterMin: 10, // doctor can mark a no-show 10 minutes after the start
  doctorLateAfterMin: 15, // patient may cancel free of charge if the doctor is 15+ minutes late
};

const MIN = 60 * 1000;

/** 'YYYY-MM-DD' + 'HH:mm' -> Date in server local time */
export function at(dateStr, hhmm) {
  return new Date(`${dateStr}T${hhmm}:00`);
}

/** Every moment that matters for one appointment's call. */
export function callTimes(appt) {
  const startAt = at(appt.date, appt.startTime);
  const endAt = at(appt.date, appt.endTime);
  return {
    opensAt: new Date(startAt - CALL_RULES.joinBeforeMin * MIN),
    canAdmitAt: new Date(startAt - CALL_RULES.doctorEarlyMin * MIN),
    startAt,
    warnAt: new Date(endAt - CALL_RULES.warnBeforeEndMin * MIN),
    endAt,
    closesAt: new Date(endAt.getTime() + CALL_RULES.graceMin * MIN),
    noShowAt: new Date(startAt.getTime() + CALL_RULES.noShowAfterMin * MIN),
    doctorLateAt: new Date(startAt.getTime() + CALL_RULES.doctorLateAfterMin * MIN),
  };
}

/**
 * Can this user join the call right now? Returns { ok, phase, reason }.
 * phase: 'not-video' | 'not-approved' | 'early' | 'open' | 'ended' | 'closed'
 */
export function joinState(appt, now = new Date()) {
  if (appt.mode !== 'Video') return { ok: false, phase: 'not-video', reason: 'This is an in-person appointment' };
  if (appt.status !== 'Approved') {
    return { ok: false, phase: 'not-approved', reason: appt.status === 'Pending' ? 'The clinic has not approved this appointment yet' : `This appointment is ${appt.status.toLowerCase()}` };
  }
  if (appt.call?.endedAt) return { ok: false, phase: 'ended', reason: 'The doctor has ended this call' };
  const t = callTimes(appt);
  if (now < t.opensAt) return { ok: false, phase: 'early', reason: 'The call is not open yet. You can join 10 minutes before your appointment.' };
  if (now > t.closesAt) return { ok: false, phase: 'closed', reason: 'The time for this call has passed' };
  return { ok: true, phase: 'open', reason: '' };
}

/** STUN is free (Google). A TURN server can be added through environment variables for strict networks. */
export function iceServers() {
  const list = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (process.env.TURN_URL) {
    list.push({ urls: process.env.TURN_URL.split(','), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  }
  return list;
}
