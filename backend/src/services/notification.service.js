import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from './socket.service.js';

/**
 * Saves a notification for each user and pushes it live over Socket.io.
 * Never throws: a failed notification must not break the main action.
 */
export async function notifyUsers(userIds, { type = 'system', title, message = '', link = '', priority = 'normal' }) {
  try {
    const ids = [...new Set(userIds.filter(Boolean).map(String))];
    if (!ids.length) return;
    const docs = await Notification.insertMany(ids.map((user) => ({ user, type, title, message, link, priority })));
    for (const n of docs) emitToUser(n.user, 'notification', n);
  } catch (err) {
    console.error('notify failed:', err.message);
  }
}

/** Notifies every active user with one of the given roles. */
export async function notifyRoles(roles, payload) {
  const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
  return notifyUsers(users.map((u) => u._id), payload);
}
