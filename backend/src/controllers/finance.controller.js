import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import { badRequest } from '../utils/httpError.js';
import { addDays, isValidDateStr, toDateStr } from '../utils/time.js';
import Expense from '../models/Expense.js';
import PayrollRun from '../models/PayrollRun.js';
import User from '../models/User.js';

const startOfDay = (s) => new Date(`${s}T00:00:00`);
const sum = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);

// GET /api/finance?start=YYYY-MM-DD&end=YYYY-MM-DD  (Admin)
// Revenue = money actually received (paid invoices, dated by payment time).
export async function financeReport(req, res) {
  const today = toDateStr();
  const monthStart = `${today.slice(0, 7)}-01`;
  const start = req.query.start || monthStart;
  const end = req.query.end || today;
  if (!isValidDateStr(start) || !isValidDateStr(end) || start > end) throw badRequest('Invalid date range');

  const paidInRange = await Invoice.find({
    status: 'Paid',
    paidAt: { $gte: startOfDay(start), $lt: startOfDay(addDays(end, 1)) },
  }).populate('doctor', 'fullName specialization').populate('appointment', 'tests');

  const paidToday = await Invoice.find({ status: 'Paid', paidAt: { $gte: startOfDay(today) } }).select('amount');
  const paidMonth = await Invoice.find({ status: 'Paid', paidAt: { $gte: startOfDay(monthStart) } }).select('amount');
  const unpaid = await Invoice.find({ status: 'Unpaid' }).select('amount');

  // Revenue per doctor
  const byDoctorMap = new Map();
  for (const inv of paidInRange) {
    const key = String(inv.doctor?._id);
    const row = byDoctorMap.get(key) || {
      doctorId: key, name: inv.doctor?.fullName || 'Unknown', specialization: inv.doctor?.specialization || '',
      visits: 0, consultation: 0, tests: 0, total: 0,
    };
    row.visits += 1;
    row.consultation += inv.consultationAmount;
    row.tests += inv.testsAmount;
    row.total += inv.amount;
    byDoctorMap.set(key, row);
  }

  // Revenue per test (from billed line items)
  const byTestMap = new Map();
  for (const inv of paidInRange) {
    for (const item of inv.items.filter((i) => i.type === 'Test')) {
      const row = byTestMap.get(item.label) || { name: item.label, count: 0, total: 0 };
      row.count += 1;
      row.total += item.amount;
      byTestMap.set(item.label, row);
    }
  }

  // Daily series for the chart
  const daily = [];
  for (let d = start; d <= end && daily.length < 366; d = addDays(d, 1)) daily.push({ date: d, revenue: 0, invoices: 0 });
  const dayIndex = new Map(daily.map((r, i) => [r.date, i]));
  for (const inv of paidInRange) {
    const i = dayIndex.get(toDateStr(inv.paidAt));
    if (i !== undefined) { daily[i].revenue += inv.amount; daily[i].invoices += 1; }
  }

  const methodAgg = await Payment.aggregate([
    { $match: { status: 'Success', createdAt: { $gte: startOfDay(start), $lt: startOfDay(addDays(end, 1)) } } },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const appointmentsInRange = await Appointment.countDocuments({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } });

  res.json({
    range: { start, end },
    summary: {
      revenueToday: sum(paidToday, (i) => i.amount),
      revenueThisMonth: sum(paidMonth, (i) => i.amount),
      revenueInRange: sum(paidInRange, (i) => i.amount),
      consultationRevenue: sum(paidInRange, (i) => i.consultationAmount),
      testRevenue: sum(paidInRange, (i) => i.testsAmount),
      discountsGiven: sum(paidInRange, (i) => i.discount),
      paidInvoices: paidInRange.length,
      outstandingAmount: sum(unpaid, (i) => i.amount),
      outstandingInvoices: unpaid.length,
      appointmentsInRange,
    },
    byDoctor: [...byDoctorMap.values()].sort((a, b) => b.total - a.total),
    byTest: [...byTestMap.values()].sort((a, b) => b.total - a.total),
    byMethod: methodAgg.map((m) => ({ method: m._id, total: m.total, count: m.count })),
    daily,
  });
}

// ---------------------------------------------------------------------------
// Profit & loss: revenue (paid invoices) − expenses − payroll, month by month
// ---------------------------------------------------------------------------
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function lastMonths(n) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

// GET /api/finance/pnl?months=12  (Admin)
export async function profitLoss(req, res) {
  const n = Math.min(Math.max(Number(req.query.months) || 12, 1), 36);
  const months = lastMonths(n);
  const first = new Date(`${months[0]}-01T00:00:00`);

  const [rev, exp, pay] = await Promise.all([
    Invoice.aggregate([
      { $match: { status: 'Paid', paidAt: { $gte: first } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$paidAt', timezone: TZ } },
        revenue: { $sum: '$amount' }, consultation: { $sum: '$consultationAmount' }, tests: { $sum: '$testsAmount' },
      } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: `${months[0]}-01` } } },
      { $group: { _id: { $substrBytes: ['$date', 0, 7] }, total: { $sum: '$amount' } } },
    ]),
    PayrollRun.find({ month: { $gte: months[0] } }).select('month total status'),
  ]);
  const r = new Map(rev.map((x) => [x._id, x]));
  const e = new Map(exp.map((x) => [x._id, x.total]));
  const p = new Map(pay.map((x) => [x.month, x]));

  const rows = months.map((m) => {
    const revenue = r.get(m)?.revenue || 0;
    const expenses = e.get(m) || 0;
    const payroll = p.get(m)?.total || 0;
    const profit = revenue - expenses - payroll;
    return {
      month: m, revenue, consultation: r.get(m)?.consultation || 0, tests: r.get(m)?.tests || 0,
      expenses, payroll, payrollStatus: p.get(m)?.status || null, profit,
      margin: revenue ? Math.round((profit / revenue) * 1000) / 10 : null,
    };
  });
  const totals = rows.reduce((t, x) => ({
    revenue: t.revenue + x.revenue, expenses: t.expenses + x.expenses, payroll: t.payroll + x.payroll, profit: t.profit + x.profit,
  }), { revenue: 0, expenses: 0, payroll: 0, profit: 0 });
  res.json({ rows, totals });
}

// ---------------------------------------------------------------------------
// Operations analytics: busiest times, doctor utilisation, cancellations
// ---------------------------------------------------------------------------
// GET /api/finance/operations?days=60  (Admin)
export async function operations(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 60, 7), 365);
  const end = toDateStr();
  const start = addDays(end, -(days - 1));
  const appts = await Appointment.find({ date: { $gte: start, $lte: addDays(end, 30) } })
    .populate('doctor', 'fullName schedule').select('date startTime status doctor patient createdAt');
  const past = appts.filter((a) => a.date <= end && a.date >= start);

  // Heatmap: weekday x hour, non-cancelled bookings
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heat = {};
  for (const a of appts.filter((x) => x.status !== 'Cancelled')) {
    const k = `${new Date(`${a.date}T00:00:00`).getDay()}-${Number(a.startTime.slice(0, 2))}`;
    heat[k] = (heat[k] || 0) + 1;
  }
  const heatmap = Object.entries(heat).map(([k, count]) => {
    const [d, h] = k.split('-').map(Number);
    return { day: DAY[d], dayIndex: d, hour: h, count };
  });

  // Utilisation: booked slots / available slots per doctor in the past window
  const doctors = await User.find({ role: 'Doctor', isActive: true }).select('fullName schedule');
  const utilisation = doctors.map((doc) => {
    let capacity = 0;
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(`${d}T00:00:00`).getDay()];
      if (doc.schedule?.days?.includes(dayName)) capacity += (doc.schedule.endHour - doc.schedule.startHour) * 4;
    }
    const mine = past.filter((a) => String(a.doctor?._id) === String(doc._id));
    const used = mine.filter((a) => a.status !== 'Cancelled').length;
    return {
      doctorId: doc._id, name: doc.fullName, capacity, booked: used,
      completed: mine.filter((a) => a.status === 'Completed').length,
      cancelled: mine.filter((a) => a.status === 'Cancelled').length,
      rate: capacity ? Math.round((used / capacity) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.rate - a.rate);

  const status = ['Pending', 'Approved', 'Completed', 'Cancelled'].map((s) => ({ status: s, count: past.filter((a) => a.status === s).length }));
  const total = past.length;
  const newPatients = await User.countDocuments({ role: 'Patient', createdAt: { $gte: new Date(`${start}T00:00:00`) } });

  res.json({
    range: { start, end, days },
    kpis: {
      appointments: total,
      completionRate: total ? Math.round((status[2].count / total) * 1000) / 10 : 0,
      cancellationRate: total ? Math.round((status[3].count / total) * 1000) / 10 : 0,
      newPatients,
      uniquePatients: new Set(past.map((a) => String(a.patient))).size,
    },
    status, heatmap, utilisation,
  });
}
