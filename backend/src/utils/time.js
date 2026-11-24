// Dates are stored as 'YYYY-MM-DD' strings and times as 'HH:mm' strings,
// which avoids timezone surprises between the browser, server and database.

export const SLOT_MINUTES = 15;
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n) => String(n).padStart(2, '0');

export function toDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00`).getTime());
}

export function dayName(dateStr) {
  return DAYS[new Date(`${dateStr}T00:00:00`).getDay()];
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function addMonths(dateStr, months) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return toDateStr(d);
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Visit modes. A video visit takes two slots (30 minutes) so there is time to connect. */
export const VISIT_MODES = ['In-person', 'Video'];
export const VIDEO_MINUTES = 30;
export const durationFor = (mode) => (mode === 'Video' ? VIDEO_MINUTES : SLOT_MINUTES);

/** Hours a doctor takes this kind of visit. Video visits may have their own (e.g. evening) hours. */
export function hoursFor(schedule, mode) {
  if (mode === 'Video' && Number.isInteger(schedule?.videoStartHour) && Number.isInteger(schedule?.videoEndHour)) {
    return { startHour: schedule.videoStartHour, endHour: schedule.videoEndHour };
  }
  return { startHour: schedule?.startHour ?? 9, endHour: schedule?.endHour ?? 17 };
}

/** Turns booked appointments into [startMin, endMin) ranges. */
export const toRanges = (appts) => appts.map((a) => [toMinutes(a.startTime), toMinutes(a.endTime)]);
export const overlaps = (start, end, ranges) => ranges.some(([s, e]) => start < e && end > s);

/**
 * Build slots (every 15 minutes) for a doctor's hours on a given date.
 * A slot is free only if the whole visit (15 or 30 minutes) fits in the hours and touches no booking.
 * Booked slots and (for today) past slots are marked unavailable.
 */
export function generateSlots(startHour, endHour, bookedRanges = [], dateStr, duration = SLOT_MINUTES) {
  const now = new Date();
  const isToday = dateStr === toDateStr(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (let m = startHour * 60; m + duration <= endHour * 60; m += SLOT_MINUTES) {
    const booked = overlaps(m, m + SLOT_MINUTES, bookedRanges);
    const free = !overlaps(m, m + duration, bookedRanges);
    const past = isToday && m <= nowMin;
    slots.push({ time: fromMinutes(m), endTime: fromMinutes(m + duration), available: free && !past, booked });
  }
  return slots;
}
