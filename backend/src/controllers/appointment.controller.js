import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import MedicalTest from '../models/MedicalTest.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import DoctorLeave from '../models/DoctorLeave.js';
import {
  dayName, durationFor, fromMinutes, hoursFor, isValidDateStr, overlaps, SLOT_MINUTES, toDateStr, toMinutes, toRanges, VISIT_MODES,
} from '../utils/time.js';
import { notifyRoles, notifyUsers } from '../services/notification.service.js';
import { audit } from '../services/audit.service.js';
import { emitCallClosed, endCall } from '../services/call.service.js';
import { getIO } from '../services/socket.service.js';

const populateAll = (q) =>
  q.populate('doctor', 'fullName specialization consultationFee email')
    .populate('patient', 'fullName email contactNumber age gender address');

async function findOr404(id) {
  const appt = await Appointment.findById(id);
  if (!appt) throw notFound('Appointment not found');
  return appt;
}

// POST /api/appointments  (Patient books a slot)
export async function bookAppointment(req, res) {
  const { doctorId, date, startTime, description } = req.body;
  const mode = req.body.mode || 'In-person';
  if (!doctorId || !isValidDateStr(date) || !/^\d{2}:\d{2}$/.test(startTime || '')) {
    throw badRequest('Doctor, date and time slot are required');
  }
  if (!VISIT_MODES.includes(mode)) throw badRequest('Visit type must be In-person or Video');

  const doctor = await User.findOne({ _id: doctorId, role: 'Doctor', isActive: true });
  if (!doctor) throw notFound('Doctor not found');

  // Validate the slot against the doctor's schedule (video visits may have their own hours)
  const { schedule } = doctor;
  const start = toMinutes(startTime);
  const duration = durationFor(mode);
  const hours = hoursFor(schedule, mode);
  if (!schedule?.days?.includes(dayName(date))) throw badRequest(`${doctor.fullName} does not work on ${dayName(date)}`);
  if (await DoctorLeave.exists({ doctor: doctor._id, date })) throw badRequest(`${doctor.fullName} is on leave on ${date}`);
  if (start < hours.startHour * 60 || start + duration > hours.endHour * 60 || start % SLOT_MINUTES !== 0) {
    throw badRequest(`That time is outside the doctor's ${mode === 'Video' ? 'video consultation' : 'working'} hours`);
  }
  const now = new Date();
  if (date < toDateStr(now) || (date === toDateStr(now) && start <= now.getHours() * 60 + now.getMinutes())) {
    throw badRequest('That time slot has already passed');
  }

  // One active booking per patient per doctor per day keeps the schedule fair
  const sameDay = await Appointment.exists({ patient: req.user._id, doctor: doctor._id, date, holdsSlot: true });
  if (sameDay) throw badRequest('You already have an appointment with this doctor on that day');

  // A 30-minute video visit must not overlap a booking that starts inside it
  const taken = await Appointment.find({ doctor: doctor._id, date, holdsSlot: true }).select('startTime endTime');
  if (overlaps(start, start + duration, toRanges(taken))) throw conflict('That time slot was just booked by someone else. Please choose another.');

  // The unique index on (doctor, date, startTime) also rejects simultaneous double-booking with a 409
  const appt = await Appointment.create({
    doctor: doctor._id,
    patient: req.user._id,
    date,
    startTime,
    endTime: fromMinutes(start + duration),
    mode,
    description: description || '',
    consultationFee: doctor.consultationFee,
  });
  await notifyRoles(['Staff', 'Admin'], {
    type: 'appointment', title: `New ${mode === 'Video' ? 'video ' : ''}appointment request`,
    message: `${req.user.fullName} with ${doctor.fullName} on ${date} at ${startTime}`, link: '/app/appointments',
  });
  res.status(201).json(await populateAll(Appointment.findById(appt._id)));
}

// GET /api/appointments/mine  (Patient)
export async function myAppointments(req, res) {
  const list = await populateAll(Appointment.find({ patient: req.user._id }).sort({ date: -1, startTime: -1 }));
  res.json(list);
}

// GET /api/appointments/doctor?status=&date=  (Doctor)
export async function doctorAppointments(req, res) {
  const filter = { doctor: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.date = req.query.date;
  const list = await populateAll(Appointment.find(filter).sort({ date: -1, startTime: 1 }));
  res.json(list);
}

// GET /api/appointments?status=&date=&search=  (Admin, Staff)
export async function allAppointments(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.date = req.query.date;
  let list = await populateAll(Appointment.find(filter).sort({ date: -1, startTime: -1 }).limit(500));
  if (req.query.search) {
    const s = String(req.query.search).toLowerCase();
    list = list.filter((a) =>
      a.patient?.fullName?.toLowerCase().includes(s) || a.doctor?.fullName?.toLowerCase().includes(s));
  }
  res.json(list);
}

// GET /api/appointments/:id  (owner patient, owner doctor, staff, admin)
export async function getAppointment(req, res) {
  const appt = await populateAll(Appointment.findById(req.params.id));
  if (!appt) throw notFound('Appointment not found');
  const { role, _id } = req.user;
  if (role === 'Patient' && String(appt.patient._id) !== String(_id)) throw forbidden();
  if (role === 'Doctor' && String(appt.doctor._id) !== String(_id)) throw forbidden();
  res.json(appt);
}

// PATCH /api/appointments/:id/approve  (Admin, Staff)
export async function approveAppointment(req, res) {
  const appt = await findOr404(req.params.id);
  if (appt.status !== 'Pending') throw badRequest(`Only pending appointments can be approved (this one is ${appt.status})`);
  appt.status = 'Approved';
  await appt.save();
  const full = await populateAll(Appointment.findById(appt._id));
  await notifyUsers([full.patient._id], {
    type: 'appointment', title: 'Appointment confirmed',
    message: `${full.doctor.fullName} on ${full.date} at ${full.startTime}`, link: `/app/appointments/${full._id}`,
  });
  await notifyUsers([full.doctor._id], {
    type: 'appointment', title: 'New patient on your schedule',
    message: `${full.patient.fullName} on ${full.date} at ${full.startTime}`, link: '/app/doctor/appointments',
  });
  await audit(req, 'appointment.approve', { entity: 'Appointment', entityId: appt._id, summary: `${full.patient.fullName} with ${full.doctor.fullName}, ${full.date} ${full.startTime}` });
  res.json(full);
}

// PATCH /api/appointments/:id/cancel  (Admin, Staff, or the patient while still Pending/Approved)
export async function cancelAppointment(req, res) {
  const appt = await findOr404(req.params.id);
  if (req.user.role === 'Patient' && String(appt.patient) !== String(req.user._id)) throw forbidden();
  if (!['Pending', 'Approved'].includes(appt.status)) throw badRequest(`A ${appt.status.toLowerCase()} appointment cannot be cancelled`);
  appt.status = 'Cancelled';
  appt.holdsSlot = false; // frees the slot for others
  appt.cancelledBy = req.user.role;
  await appt.save();
  if (appt.mode === 'Video') emitCallClosed(getIO(), appt._id, 'Cancelled');
  const full = await populateAll(Appointment.findById(appt._id));
  const when = `${full.date} at ${full.startTime}`;
  if (req.user.role === 'Patient') {
    await notifyRoles(['Staff'], { type: 'appointment', title: 'Appointment cancelled by patient', message: `${full.patient.fullName} with ${full.doctor.fullName}, ${when}`, link: '/app/appointments' });
  } else {
    await notifyUsers([full.patient._id], { type: 'appointment', priority: 'high', title: 'Appointment cancelled', message: `Your visit with ${full.doctor.fullName} on ${when} was cancelled by the clinic. Please book another slot.`, link: '/app/doctors' });
  }
  await audit(req, 'appointment.cancel', { entity: 'Appointment', entityId: appt._id, summary: `${full.patient.fullName} with ${full.doctor.fullName}, ${when}` });
  res.json(full);
}

// PATCH /api/appointments/:id/diagnosis  (Doctor completes the visit)
export async function submitDiagnosis(req, res) {
  const appt = await findOr404(req.params.id);
  if (String(appt.doctor) !== String(req.user._id)) throw forbidden('This is not your appointment');
  if (!['Approved', 'Completed'].includes(appt.status)) throw badRequest('Only approved appointments can be completed');
  if (appt.isInvoiceGenerated) throw badRequest('This visit has already been billed and can no longer be edited');
  if (appt.date > toDateStr()) throw badRequest(`This visit is scheduled for ${appt.date}. You can complete it on or after that day`);

  const { diagnosis, prescription, followUpDate, testIds = [] } = req.body;
  if (!diagnosis?.trim()) throw badRequest('Diagnosis is required');
  if (followUpDate && (!isValidDateStr(followUpDate) || followUpDate <= appt.date)) {
    throw badRequest('Follow-up date must be after the appointment date');
  }

  appt.diagnosis = diagnosis.trim();
  appt.prescription = (prescription || '').trim();
  appt.followUpDate = followUpDate || '';

  // Sync suggested tests: keep ones still selected (with their status), add new ones, drop untouched removed ones
  const tests = await MedicalTest.find({ _id: { $in: testIds }, isActive: true });
  const wanted = new Set(tests.map((t) => String(t._id)));
  appt.tests = appt.tests.filter((t) => wanted.has(String(t.test)) || t.status !== 'Suggested');
  const existing = new Set(appt.tests.map((t) => String(t.test)));
  for (const t of tests) {
    if (!existing.has(String(t._id))) appt.tests.push({ test: t._id, testName: t.testName, price: t.price });
  }

  const firstTime = appt.status !== 'Completed';
  appt.status = 'Completed';
  await appt.save();
  // Completing a video visit closes its call for good
  if (appt.mode === 'Video' && appt.call?.startedAt && !appt.call.endedAt) await endCall(getIO(), appt, 'Doctor');
  const full = await populateAll(Appointment.findById(appt._id));
  if (firstTime) {
    const suggested = full.tests.filter((t) => t.status === 'Suggested').length;
    await notifyUsers([full.patient._id], {
      type: 'visit', title: 'Your prescription is ready',
      message: `${full.doctor.fullName} completed your visit.${suggested ? ` ${suggested} test${suggested > 1 ? 's were' : ' was'} recommended. Please accept or decline.` : ''}`,
      link: `/app/appointments/${full._id}`,
    });
    await notifyRoles(['Staff'], { type: 'billing', title: 'Visit ready to bill', message: `${full.patient.fullName} with ${full.doctor.fullName}`, link: '/app/billing' });
  }
  await audit(req, firstTime ? 'appointment.complete' : 'appointment.notes.update', { entity: 'Appointment', entityId: appt._id, summary: `${full.patient.fullName}: ${appt.diagnosis.slice(0, 80)}` });
  res.json(full);
}

// PATCH /api/appointments/:id/tests/:testItemId  { action: 'accept' | 'reject' }  (Patient)
export async function respondToTest(req, res) {
  const appt = await findOr404(req.params.id);
  if (String(appt.patient) !== String(req.user._id)) throw forbidden();
  if (appt.isInvoiceGenerated) throw badRequest('This visit has already been billed');
  const item = appt.tests.id(req.params.testItemId);
  if (!item) throw notFound('Test not found on this appointment');
  if (!['Suggested', 'Accepted', 'Rejected'].includes(item.status)) throw badRequest('This test is already completed');

  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) throw badRequest('Action must be accept or reject');
  item.status = action === 'accept' ? 'Accepted' : 'Rejected';
  await appt.save();
  res.json(await populateAll(Appointment.findById(appt._id)));
}

// GET /api/appointments/lab-tests?status=Accepted|Completed  (Staff, Admin)
export async function labTests(req, res) {
  const status = req.query.status || 'Accepted';
  const list = await populateAll(Appointment.find({ 'tests.status': status }).sort({ date: -1 }));
  const rows = [];
  for (const a of list) {
    for (const t of a.tests) {
      if (t.status === status) {
        rows.push({
          appointmentId: a._id, testItemId: t._id, testName: t.testName, price: t.price, status: t.status,
          result: t.result, completedAt: t.completedAt, date: a.date, patient: a.patient, doctor: a.doctor,
        });
      }
    }
  }
  res.json(rows);
}

// PATCH /api/appointments/:id/tests/:testItemId/complete  (Staff, Admin)
export async function completeTest(req, res) {
  const appt = await findOr404(req.params.id);
  const item = appt.tests.id(req.params.testItemId);
  if (!item) throw notFound('Test not found on this appointment');
  if (item.status !== 'Accepted') throw badRequest('Only tests the patient accepted can be marked completed');
  item.status = 'Completed';
  item.completedAt = new Date();
  item.result = (req.body.result || '').trim();
  await appt.save();
  await notifyUsers([appt.patient, appt.doctor], {
    type: 'test', title: `${item.testName} result available`,
    message: item.result || 'The test has been completed.', link: `/app/appointments/${appt._id}`,
  });
  await audit(req, 'test.complete', { entity: 'Appointment', entityId: appt._id, summary: `${item.testName}${item.result ? `: ${item.result}` : ''}` });
  res.json({ message: `${item.testName} marked as completed` });
}
