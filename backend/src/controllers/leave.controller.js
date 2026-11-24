import DoctorLeave from '../models/DoctorLeave.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { audit } from '../services/audit.service.js';
import { notifyUsers } from '../services/notification.service.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { isValidDateStr, toDateStr } from '../utils/time.js';

const doctorIdFor = (req) => (req.user.role === 'Doctor' ? req.user._id : req.params.doctorId || req.body.doctorId);

// GET /api/leaves?doctorId=   (Doctor sees own; Admin any)
export async function listLeaves(req, res) {
  const doctor = req.user.role === 'Doctor' ? req.user._id : req.query.doctorId;
  const filter = { date: { $gte: toDateStr() } };
  if (doctor) filter.doctor = doctor;
  res.json(await DoctorLeave.find(filter).populate('doctor', 'fullName').sort({ date: 1 }));
}

// POST /api/leaves  { date, reason, doctorId? }
// Existing bookings that day are cancelled and the patients are notified.
export async function addLeave(req, res) {
  const doctorId = doctorIdFor(req);
  const { date, reason = '' } = req.body;
  if (!isValidDateStr(date) || date < toDateStr()) throw badRequest('Choose today or a future date');
  const doctor = await User.findOne({ _id: doctorId, role: 'Doctor' });
  if (!doctor) throw notFound('Doctor not found');

  const leave = await DoctorLeave.create({ doctor: doctor._id, date, reason, createdBy: req.user._id });

  const affected = await Appointment.find({ doctor: doctor._id, date, holdsSlot: true, status: { $in: ['Pending', 'Approved'] } });
  for (const a of affected) {
    a.status = 'Cancelled';
    a.holdsSlot = false;
    a.cancelledBy = 'Doctor leave';
    await a.save();
  }
  await notifyUsers(affected.map((a) => a.patient), {
    type: 'appointment', priority: 'high', title: 'Appointment cancelled',
    message: `${doctor.fullName} is unavailable on ${date}. Please book another slot. We're sorry for the inconvenience.`,
    link: '/app/doctors',
  });
  await audit(req, 'leave.add', { entity: 'DoctorLeave', entityId: leave._id, summary: `${doctor.fullName} on ${date}${affected.length ? `, ${affected.length} appointment(s) cancelled` : ''}` });
  res.status(201).json({ leave, cancelled: affected.length });
}

// DELETE /api/leaves/:id
export async function removeLeave(req, res) {
  const leave = await DoctorLeave.findById(req.params.id);
  if (!leave) throw notFound('Leave not found');
  if (req.user.role === 'Doctor' && String(leave.doctor) !== String(req.user._id)) throw forbidden();
  await leave.deleteOne();
  await audit(req, 'leave.remove', { entity: 'DoctorLeave', entityId: leave._id, summary: leave.date });
  res.json({ message: 'Leave removed' });
}
