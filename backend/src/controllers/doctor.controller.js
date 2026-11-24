import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import DoctorLeave from '../models/DoctorLeave.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { dayName, durationFor, generateSlots, hoursFor, isValidDateStr, toDateStr, toRanges } from '../utils/time.js';

const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/doctors?search=&specialization=
export async function listDoctors(req, res) {
  const filter = { role: 'Doctor', isActive: true };
  if (req.query.specialization) filter.specialization = req.query.specialization;
  if (req.query.search) {
    const rx = new RegExp(escapeRx(req.query.search), 'i');
    filter.$or = [{ fullName: rx }, { specialization: rx }];
  }
  const doctors = await User.find(filter)
    .select('fullName email specialization consultationFee bio schedule gender')
    .sort({ fullName: 1 });
  const specializations = await User.distinct('specialization', { role: 'Doctor', isActive: true });
  res.json({ doctors, specializations: specializations.filter(Boolean).sort() });
}

// GET /api/doctors/:id
export async function getDoctor(req, res) {
  const doctor = await User.findOne({ _id: req.params.id, role: 'Doctor', isActive: true })
    .select('fullName email specialization consultationFee bio schedule gender');
  if (!doctor) throw notFound('Doctor not found');
  res.json(doctor);
}

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
export async function getSlots(req, res) {
  const { date } = req.query;
  if (!isValidDateStr(date)) throw badRequest('A valid date is required');
  if (date < toDateStr()) throw badRequest('You cannot book a date in the past');

  const doctor = await User.findOne({ _id: req.params.id, role: 'Doctor', isActive: true });
  if (!doctor) throw notFound('Doctor not found');

  const schedule = doctor.schedule;
  const day = dayName(date);
  if (!schedule || !schedule.days?.includes(day)) {
    return res.json({ date, day, working: false, slots: [] });
  }
  const leave = await DoctorLeave.findOne({ doctor: doctor._id, date });
  if (leave) return res.json({ date, day, working: false, onLeave: true, reason: leave.reason, slots: [] });

  const mode = req.query.mode === 'Video' ? 'Video' : 'In-person';
  const { startHour, endHour } = hoursFor(schedule, mode);
  const booked = await Appointment.find({ doctor: doctor._id, date, holdsSlot: true }).select('startTime endTime');
  const slots = generateSlots(startHour, endHour, toRanges(booked), date, durationFor(mode));
  res.json({ date, day, working: true, mode, startHour, endHour, minutes: durationFor(mode), slots });
}
