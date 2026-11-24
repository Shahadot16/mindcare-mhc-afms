import AuditLog from '../models/AuditLog.js';

/** Records who did what. Never throws. */
export async function audit(req, action, { entity = '', entityId = '', summary = '' } = {}) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      actorName: req.user?.fullName || 'System',
      actorRole: req.user?.role || 'System',
      action,
      entity,
      entityId: entityId ? String(entityId) : '',
      summary,
      ip: req.ip,
    });
  } catch (err) {
    console.error('audit failed:', err.message);
  }
}
