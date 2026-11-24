import AuditLog from '../models/AuditLog.js';

// GET /api/audit?action=&search=&page=1
export async function listAudit(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 30;
  const filter = {};
  if (req.query.action) filter.action = new RegExp(`^${String(req.query.action).replace(/[^a-z.]/gi, '')}`);
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ actorName: rx }, { summary: rx }];
  }
  const [items, total, actions] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(filter),
    AuditLog.distinct('action'),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), actions: actions.sort() });
}
