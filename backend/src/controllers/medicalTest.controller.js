import MedicalTest from '../models/MedicalTest.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { audit } from '../services/audit.service.js';

// GET /api/tests?all=true   (active tests by default; all=true for admin/staff management)
export async function listTests(req, res) {
  const filter = req.query.all === 'true' && ['Admin', 'Staff'].includes(req.user.role) ? {} : { isActive: true };
  res.json(await MedicalTest.find(filter).sort({ testName: 1 }));
}

// POST /api/tests
export async function createTest(req, res) {
  const { testName, price, description } = req.body;
  if (!testName || price === undefined || price === '') throw badRequest('Test name and price are required');
  const test = await MedicalTest.create({ testName, price: Number(price), description });
  await audit(req, 'test.create', { entity: 'MedicalTest', entityId: test._id, summary: `${test.testName} ৳${test.price}` });
  res.status(201).json(test);
}

// PUT /api/tests/:id
export async function updateTest(req, res) {
  const test = await MedicalTest.findById(req.params.id);
  if (!test) throw notFound('Test not found');
  for (const f of ['testName', 'description', 'isActive']) if (req.body[f] !== undefined) test[f] = req.body[f];
  if (req.body.price !== undefined) test.price = Number(req.body.price);
  await test.save();
  await audit(req, 'test.update', { entity: 'MedicalTest', entityId: test._id, summary: `${test.testName} ৳${test.price}${test.isActive ? '' : ' (inactive)'}` });
  res.json(test);
}

// DELETE /api/tests/:id  (soft delete: tests stay on old appointments)
export async function deleteTest(req, res) {
  const test = await MedicalTest.findById(req.params.id);
  if (!test) throw notFound('Test not found');
  test.isActive = false;
  await test.save();
  res.json({ message: `${test.testName} was deactivated` });
}
