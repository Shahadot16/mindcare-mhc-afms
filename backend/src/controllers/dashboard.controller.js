import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import MedicalTest from '../models/MedicalTest.js';
import MoodEntry from '../models/MoodEntry.js';
import Assessment from '../models/Assessment.js';
import { toDateStr } from '../utils/time.js';

const sumAmount = async (filter) => {
  const [r] = await Invoice.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return r?.total || 0;
};

const upcomingQuery = (filter, today) =>
  Appointment.find({ ...filter, date: { $gte: today }, status: { $in: ['Pending', 'Approved'] } })
    .populate('doctor', 'fullName specialization')
    .populate('patient', 'fullName')
    .sort({ date: 1, startTime: 1 })
    .limit(6);

// GET /api/dashboard — numbers tailored to the logged-in role
export async function dashboard(req, res) {
  const { role, _id } = req.user;
  const today = toDateStr();
  const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00`);

  if (role === 'Admin') {
    const [doctors, staff, patients, pending, todayCount, monthRevenue, outstanding, tests, upcoming] = await Promise.all([
      User.countDocuments({ role: 'Doctor', isActive: true }),
      User.countDocuments({ role: 'Staff', isActive: true }),
      User.countDocuments({ role: 'Patient', isActive: true }),
      Appointment.countDocuments({ status: 'Pending' }),
      Appointment.countDocuments({ date: today, status: { $ne: 'Cancelled' } }),
      sumAmount({ status: 'Paid', paidAt: { $gte: monthStart } }),
      sumAmount({ status: 'Unpaid' }),
      MedicalTest.countDocuments({ isActive: true }),
      upcomingQuery({}, today),
    ]);
    return res.json({ stats: { doctors, staff, patients, pending, todayCount, monthRevenue, outstanding, tests }, upcoming });
  }

  if (role === 'Staff') {
    const [pending, todayCount, unbilled, labPending, unpaidInvoices, upcoming] = await Promise.all([
      Appointment.countDocuments({ status: 'Pending' }),
      Appointment.countDocuments({ date: today, status: { $ne: 'Cancelled' } }),
      Appointment.countDocuments({ status: 'Completed', isInvoiceGenerated: false }),
      Appointment.countDocuments({ 'tests.status': 'Accepted' }),
      Invoice.countDocuments({ status: 'Unpaid' }),
      upcomingQuery({}, today),
    ]);
    return res.json({ stats: { pending, todayCount, unbilled, labPending, unpaidInvoices }, upcoming });
  }

  if (role === 'Doctor') {
    const [todayList, approved, completed, patients, upcoming] = await Promise.all([
      Appointment.find({ doctor: _id, date: today, status: { $in: ['Approved', 'Pending', 'Completed'] } })
        .populate('patient', 'fullName age gender').sort({ startTime: 1 }),
      Appointment.countDocuments({ doctor: _id, status: 'Approved' }),
      Appointment.countDocuments({ doctor: _id, status: 'Completed' }),
      Appointment.distinct('patient', { doctor: _id, status: 'Completed' }),
      upcomingQuery({ doctor: _id }, today),
    ]);
    return res.json({
      stats: { today: todayList.length, toSee: approved, completed, patients: patients.length },
      todayList, upcoming, schedule: req.user.schedule,
    });
  }

  // Patient
  const [upcoming, completed, unpaid, unpaidAmount, pendingTests, latest] = await Promise.all([
    upcomingQuery({ patient: _id }, today),
    Appointment.countDocuments({ patient: _id, status: 'Completed' }),
    Invoice.countDocuments({ patient: _id, status: 'Unpaid' }),
    sumAmount({ patient: _id, status: 'Unpaid' }),
    Appointment.countDocuments({ patient: _id, 'tests.status': 'Suggested' }),
    Appointment.findOne({ patient: _id, status: 'Completed' }).sort({ date: -1 }).populate('doctor', 'fullName specialization'),
  ]);
  const [moodToday, recentMoods, phq, gad] = await Promise.all([
    MoodEntry.findOne({ patient: _id, date: today }),
    MoodEntry.find({ patient: _id }).sort({ date: -1 }).limit(7).select('date mood'),
    Assessment.findOne({ patient: _id, type: 'PHQ9' }).sort({ createdAt: -1 }).select('score severity createdAt'),
    Assessment.findOne({ patient: _id, type: 'GAD7' }).sort({ createdAt: -1 }).select('score severity createdAt'),
  ]);
  res.json({
    stats: { upcoming: upcoming.length, completed, unpaid, unpaidAmount, pendingTests },
    upcoming, latest, wellbeing: { moodToday, recentMoods: recentMoods.reverse(), phq, gad },
  });
}
