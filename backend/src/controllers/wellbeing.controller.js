import Assessment from '../models/Assessment.js';
import MoodEntry, { EMOTIONS } from '../models/MoodEntry.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { DEFINITIONS, OPTIONS, scoreAssessment } from '../constants/assessments.js';
import { notifyRoles, notifyUsers } from '../services/notification.service.js';
import { audit } from '../services/audit.service.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { addDays, isValidDateStr, toDateStr } from '../utils/time.js';

// ---------- Assessments (PHQ-9 / GAD-7) ----------

// GET /api/assessments/definitions
export function definitions(_req, res) {
  res.json({ options: OPTIONS, types: Object.values(DEFINITIONS) });
}

// POST /api/assessments  { type, answers }  (Patient)
export async function submitAssessment(req, res) {
  const { type, answers } = req.body;
  let result;
  try {
    result = scoreAssessment(type, answers);
  } catch (e) {
    throw badRequest(e.message);
  }
  const doc = await Assessment.create({ patient: req.user._id, type, answers, ...result });

  const label = DEFINITIONS[type].name;
  if (result.riskFlag) {
    // Safety first: alert every doctor treating this patient, plus admins
    const doctorIds = await Appointment.distinct('doctor', { patient: req.user._id, status: { $ne: 'Cancelled' } });
    const payload = {
      type: 'risk', priority: 'high',
      title: `Risk alert: ${req.user.fullName}`,
      message: `${label} answer indicates thoughts of self-harm (score ${result.score}, ${result.severity}). Please review promptly.`,
      link: `/app/patients/${req.user._id}`,
    };
    await notifyUsers(doctorIds, payload);
    await notifyRoles(['Admin'], payload);
  } else if (result.score >= 15) {
    const doctorIds = await Appointment.distinct('doctor', { patient: req.user._id, status: { $ne: 'Cancelled' } });
    await notifyUsers(doctorIds, {
      type: 'visit', title: `${req.user.fullName}: ${result.severity.toLowerCase()} ${DEFINITIONS[type].short.toLowerCase()} score`,
      message: `${label} score ${result.score}/${DEFINITIONS[type].max}.`, link: `/app/patients/${req.user._id}`,
    });
  }
  res.status(201).json(doc);
}

// GET /api/assessments/mine  (Patient)
export async function myAssessments(req, res) {
  res.json(await Assessment.find({ patient: req.user._id }).sort({ createdAt: -1 }));
}

// PATCH /api/assessments/:id/review  (Doctor, Admin) — acknowledges a risk alert
export async function reviewAssessment(req, res) {
  const a = await Assessment.findById(req.params.id);
  if (!a) throw notFound('Assessment not found');
  await assertCanViewPatient(req.user, a.patient);
  a.reviewedBy = req.user._id;
  a.reviewedAt = new Date();
  await a.save();
  await audit(req, 'assessment.review', { entity: 'Assessment', entityId: a._id, summary: `${a.type} score ${a.score}` });
  res.json(a);
}

// GET /api/assessments/alerts  (Doctor, Admin) — unreviewed risk flags
export async function riskAlerts(req, res) {
  const filter = { riskFlag: true, reviewedAt: { $exists: false } };
  if (req.user.role === 'Doctor') {
    filter.patient = { $in: await Appointment.distinct('patient', { doctor: req.user._id }) };
  }
  res.json(await Assessment.find(filter).populate('patient', 'fullName age gender contactNumber').sort({ createdAt: -1 }));
}

// ---------- Mood tracker ----------

// PUT /api/moods  { date?, mood, emotions, sleepHours, anxiety, note }  (Patient, upsert per day)
export async function saveMood(req, res) {
  const date = req.body.date || toDateStr();
  if (!isValidDateStr(date) || date > toDateStr()) throw badRequest('Invalid date');
  const mood = Number(req.body.mood);
  if (!(mood >= 1 && mood <= 5)) throw badRequest('Choose how you feel (1 to 5)');
  const emotions = (req.body.emotions || []).filter((e) => EMOTIONS.includes(e));
  const update = {
    mood, emotions, note: (req.body.note || '').slice(0, 1000),
    sleepHours: req.body.sleepHours === '' || req.body.sleepHours == null ? undefined : Number(req.body.sleepHours),
    anxiety: req.body.anxiety === '' || req.body.anxiety == null ? undefined : Number(req.body.anxiety),
  };
  const entry = await MoodEntry.findOneAndUpdate(
    { patient: req.user._id, date },
    { $set: update },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(entry);
}

// GET /api/moods/mine?days=30  (Patient)
export async function myMoods(req, res) {
  const days = Math.min(Number(req.query.days) || 30, 365);
  const from = addDays(toDateStr(), -(days - 1));
  const list = await MoodEntry.find({ patient: req.user._id, date: { $gte: from } }).sort({ date: 1 });
  res.json({ from, to: toDateStr(), emotions: EMOTIONS, entries: list });
}

// ---------- Patient record (clinical overview) ----------

async function assertCanViewPatient(user, patientId) {
  if (user.role === 'Admin') return;
  if (user.role === 'Patient' && String(user._id) === String(patientId)) return;
  if (user.role === 'Doctor' && await Appointment.exists({ doctor: user._id, patient: patientId })) return;
  throw forbidden('You can only view records of your own patients');
}

// GET /api/patients/:id/record  (Doctor of the patient, Admin, or the patient)
export async function patientRecord(req, res) {
  const patient = await User.findOne({ _id: req.params.id, role: 'Patient' });
  if (!patient) throw notFound('Patient not found');
  await assertCanViewPatient(req.user, patient._id);

  const [appointments, assessments, moods] = await Promise.all([
    Appointment.find({ patient: patient._id }).populate('doctor', 'fullName specialization').sort({ date: -1, startTime: -1 }),
    Assessment.find({ patient: patient._id }).sort({ createdAt: 1 }),
    MoodEntry.find({ patient: patient._id, date: { $gte: addDays(toDateStr(), -59) } }).sort({ date: 1 }),
  ]);

  const completed = appointments.filter((a) => a.status === 'Completed');
  const lastOf = (t) => [...assessments].reverse().find((a) => a.type === t) || null;
  const avgMood = moods.length ? Math.round((moods.reduce((s, m) => s + m.mood, 0) / moods.length) * 10) / 10 : null;

  if (req.user.role !== 'Patient') {
    await audit(req, 'patient.record.view', { entity: 'User', entityId: patient._id, summary: patient.fullName });
  }
  res.json({
    patient,
    summary: {
      visits: completed.length,
      firstVisit: completed.at(-1)?.date || null,
      lastVisit: completed[0]?.date || null,
      latestPHQ9: lastOf('PHQ9'),
      latestGAD7: lastOf('GAD7'),
      avgMood,
      openRisk: assessments.filter((a) => a.riskFlag && !a.reviewedAt).length,
    },
    appointments,
    assessments,
    moods,
  });
}

// GET /api/patients  (Doctor: own patients; Admin: all) with latest scores
export async function listPatients(req, res) {
  const filter = { role: 'Patient' };
  if (req.user.role === 'Doctor') filter._id = { $in: await Appointment.distinct('patient', { doctor: req.user._id }) };
  const patients = await User.find(filter).select('fullName email age gender contactNumber createdAt isActive').sort({ fullName: 1 });
  const ids = patients.map((p) => p._id);
  const [latest, visits, risks] = await Promise.all([
    Assessment.aggregate([
      { $match: { patient: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { patient: '$patient', type: '$type' }, score: { $first: '$score' }, severity: { $first: '$severity' } } },
    ]),
    Appointment.aggregate([
      { $match: { patient: { $in: ids }, status: 'Completed' } },
      { $group: { _id: '$patient', count: { $sum: 1 }, last: { $max: '$date' } } },
    ]),
    Assessment.aggregate([
      { $match: { patient: { $in: ids }, riskFlag: true, reviewedAt: { $exists: false } } },
      { $group: { _id: '$patient', count: { $sum: 1 } } },
    ]),
  ]);
  const byId = (arr) => new Map(arr.map((x) => [String(x._id.patient || x._id), x]));
  const v = byId(visits), r = byId(risks);
  const scores = new Map();
  for (const l of latest) {
    const k = String(l._id.patient);
    scores.set(k, { ...(scores.get(k) || {}), [l._id.type]: { score: l.score, severity: l.severity } });
  }
  res.json(patients.map((p) => ({
    ...p.toJSON(),
    visits: v.get(String(p._id))?.count || 0,
    lastVisit: v.get(String(p._id))?.last || null,
    scores: scores.get(String(p._id)) || {},
    openRisk: r.get(String(p._id))?.count || 0,
  })));
}
