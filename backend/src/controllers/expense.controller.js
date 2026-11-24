import Expense, { EXPENSE_CATEGORIES } from '../models/Expense.js';
import { audit } from '../services/audit.service.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { isValidDateStr, toDateStr } from '../utils/time.js';

// GET /api/expenses?start=&end=&category=
export async function listExpenses(req, res) {
  const today = toDateStr();
  const start = req.query.start || `${today.slice(0, 7)}-01`;
  const end = req.query.end || today;
  const filter = { date: { $gte: start, $lte: end } };
  if (req.query.category) filter.category = req.query.category;
  const items = await Expense.find(filter).populate('createdBy', 'fullName').sort({ date: -1, createdAt: -1 });
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    category: c, total: items.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  res.json({ range: { start, end }, categories: EXPENSE_CATEGORIES, items, byCategory, total: items.reduce((s, e) => s + e.amount, 0) });
}

function validate(body) {
  const { title, category, amount, date } = body;
  if (!title?.trim()) throw badRequest('Title is required');
  if (!EXPENSE_CATEGORIES.includes(category)) throw badRequest('Choose a category');
  if (!(Number(amount) > 0)) throw badRequest('Amount must be greater than 0');
  if (!isValidDateStr(date) || date > toDateStr()) throw badRequest('Date must be today or earlier');
}

// POST /api/expenses
export async function createExpense(req, res) {
  validate(req.body);
  const { title, category, amount, date, note } = req.body;
  const exp = await Expense.create({ title: title.trim(), category, amount: Number(amount), date, note, createdBy: req.user._id });
  await audit(req, 'expense.create', { entity: 'Expense', entityId: exp._id, summary: `${title} ৳${amount}` });
  res.status(201).json(exp);
}

// PUT /api/expenses/:id
export async function updateExpense(req, res) {
  const exp = await Expense.findById(req.params.id);
  if (!exp) throw notFound('Expense not found');
  validate({ ...exp.toObject(), ...req.body });
  for (const f of ['title', 'category', 'date', 'note']) if (req.body[f] !== undefined) exp[f] = req.body[f];
  if (req.body.amount !== undefined) exp.amount = Number(req.body.amount);
  await exp.save();
  await audit(req, 'expense.update', { entity: 'Expense', entityId: exp._id, summary: `${exp.title} ৳${exp.amount}` });
  res.json(exp);
}

// DELETE /api/expenses/:id
export async function deleteExpense(req, res) {
  const exp = await Expense.findById(req.params.id);
  if (!exp) throw notFound('Expense not found');
  await exp.deleteOne();
  await audit(req, 'expense.delete', { entity: 'Expense', entityId: exp._id, summary: `${exp.title} ৳${exp.amount}` });
  res.json({ message: 'Expense deleted' });
}
