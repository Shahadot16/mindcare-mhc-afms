import PayrollRun from '../models/PayrollRun.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { audit } from '../services/audit.service.js';
import { notifyUsers } from '../services/notification.service.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { toDateStr } from '../utils/time.js';

const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) };
};

/** Works out each employee's pay for a month: base salary + doctor commission on paid consultations. */
export async function computeEntries(month) {
  const { from, to } = monthRange(month);
  const employees = await User.find({ role: { $in: ['Admin', 'Staff', 'Doctor'] }, isActive: true }).sort({ role: 1, fullName: 1 });
  const revenue = await Invoice.aggregate([
    { $match: { status: 'Paid', paidAt: { $gte: from, $lt: to } } },
    { $group: { _id: '$doctor', consultation: { $sum: '$consultationAmount' } } },
  ]);
  const byDoctor = new Map(revenue.map((r) => [String(r._id), r.consultation]));

  return employees.map((u) => {
    const commissionBase = u.role === 'Doctor' ? byDoctor.get(String(u._id)) || 0 : 0;
    const commission = Math.round((commissionBase * (u.commissionRate || 0)) / 100);
    return {
      user: u._id, name: u.fullName, role: u.role,
      baseSalary: u.salary || 0, commissionRate: u.commissionRate || 0, commissionBase, commission,
      total: (u.salary || 0) + commission,
    };
  });
}

// GET /api/payroll  — all runs (latest first)
export async function listPayroll(_req, res) {
  res.json(await PayrollRun.find().select('-entries').sort({ month: -1 }));
}

// GET /api/payroll/preview?month=YYYY-MM
export async function previewPayroll(req, res) {
  const month = req.query.month || toDateStr().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) throw badRequest('Month must be YYYY-MM');
  const existing = await PayrollRun.findOne({ month });
  if (existing) return res.json(existing);
  const entries = await computeEntries(month);
  res.json({ month, entries, total: entries.reduce((s, e) => s + e.total, 0), status: 'Preview' });
}

// POST /api/payroll  { month }  — saves a Draft run (re-generating a Draft refreshes the numbers)
export async function generatePayroll(req, res) {
  const { month } = req.body;
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw badRequest('Month must be YYYY-MM');
  if (month > toDateStr().slice(0, 7)) throw badRequest('You cannot run payroll for a future month');
  const existing = await PayrollRun.findOne({ month });
  if (existing?.status === 'Paid') throw badRequest('Payroll for this month is already paid and locked');

  const entries = await computeEntries(month);
  const total = entries.reduce((s, e) => s + e.total, 0);
  const run = existing
    ? Object.assign(existing, { entries, total, generatedBy: req.user._id })
    : new PayrollRun({ month, entries, total, generatedBy: req.user._id });
  await run.save();
  await audit(req, 'payroll.generate', { entity: 'PayrollRun', entityId: run._id, summary: `${month}: ৳${total}` });
  res.status(201).json(run);
}

// PATCH /api/payroll/:id/pay — marks the run as paid and notifies each employee
export async function payPayroll(req, res) {
  const run = await PayrollRun.findById(req.params.id);
  if (!run) throw notFound('Payroll run not found');
  if (run.status === 'Paid') throw badRequest('Already paid');
  run.status = 'Paid';
  run.paidAt = new Date();
  await run.save();
  for (const e of run.entries) {
    await notifyUsers([e.user], {
      type: 'payment', title: `Salary for ${run.month} paid`,
      message: `৳${e.total.toLocaleString('en-US')} (base ৳${e.baseSalary.toLocaleString('en-US')}${e.commission ? ` + commission ৳${e.commission.toLocaleString('en-US')}` : ''})`,
    });
  }
  await audit(req, 'payroll.pay', { entity: 'PayrollRun', entityId: run._id, summary: `${run.month}: ৳${run.total}` });
  res.json(run);
}
