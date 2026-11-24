import Notification from '../models/Notification.js';

// GET /api/notifications?limit=20
export async function listNotifications(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unread });
}

// PATCH /api/notifications/:id/read
export async function markRead(req, res) {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
}

// PATCH /api/notifications/read-all
export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}
