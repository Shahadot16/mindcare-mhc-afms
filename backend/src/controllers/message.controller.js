import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { emitToUser } from '../services/socket.service.js';
import { notifyUsers } from '../services/notification.service.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';

/** Doctors and patients can chat only if they share at least one (non-cancelled) appointment. */
async function canChat(me, otherId) {
  if (!mongoose.isValidObjectId(otherId)) return false;
  const filter = me.role === 'Doctor' ? { doctor: me._id, patient: otherId }
    : me.role === 'Patient' ? { patient: me._id, doctor: otherId } : null;
  if (!filter) return false;
  return Boolean(await Appointment.exists({ ...filter, status: { $ne: 'Cancelled' } }));
}

// GET /api/messages/contacts
export async function contacts(req, res) {
  const me = req.user;
  const field = me.role === 'Doctor' ? 'patient' : 'doctor';
  const mine = me.role === 'Doctor' ? 'doctor' : 'patient';
  const ids = await Appointment.distinct(field, { [mine]: me._id, status: { $ne: 'Cancelled' } });
  const users = await User.find({ _id: { $in: ids } }).select('fullName role specialization');

  const [lastMsgs, unread] = await Promise.all([
    Message.aggregate([
      { $match: { $or: [{ from: me._id, to: { $in: ids } }, { to: me._id, from: { $in: ids } }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { $cond: [{ $eq: ['$from', me._id] }, '$to', '$from'] }, text: { $first: '$text' }, at: { $first: '$createdAt' }, from: { $first: '$from' } } },
    ]),
    Message.aggregate([
      { $match: { to: me._id, read: false } },
      { $group: { _id: '$from', count: { $sum: 1 } } },
    ]),
  ]);
  const last = new Map(lastMsgs.map((m) => [String(m._id), m]));
  const un = new Map(unread.map((u) => [String(u._id), u.count]));

  const list = users.map((u) => ({
    _id: u._id, fullName: u.fullName, role: u.role, specialization: u.specialization,
    lastMessage: last.get(String(u._id)) ? { text: last.get(String(u._id)).text, at: last.get(String(u._id)).at, mine: String(last.get(String(u._id)).from) === String(me._id) } : null,
    unread: un.get(String(u._id)) || 0,
  }));
  list.sort((a, b) => new Date(b.lastMessage?.at || 0) - new Date(a.lastMessage?.at || 0) || a.fullName.localeCompare(b.fullName));
  res.json(list);
}

// GET /api/messages/unread-count
export async function unreadCount(req, res) {
  res.json({ count: await Message.countDocuments({ to: req.user._id, read: false }) });
}

// GET /api/messages/:userId  — conversation (also marks incoming as read)
export async function conversation(req, res) {
  const other = req.params.userId;
  if (!(await canChat(req.user, other))) throw forbidden('You can only message your own doctors or patients');
  const msgs = await Message.find({
    $or: [{ from: req.user._id, to: other }, { from: other, to: req.user._id }],
  }).sort({ createdAt: 1 }).limit(500);
  const { modifiedCount } = await Message.updateMany({ from: other, to: req.user._id, read: false }, { read: true });
  if (modifiedCount) emitToUser(other, 'chat:read', { by: String(req.user._id) });
  res.json(msgs);
}

// POST /api/messages/:userId  { text }
export async function sendMessage(req, res) {
  const other = req.params.userId;
  const text = String(req.body.text || '').trim();
  if (!text) throw badRequest('Message cannot be empty');
  if (text.length > 2000) throw badRequest('Message is too long (max 2000 characters)');
  if (!(await canChat(req.user, other))) throw forbidden('You can only message your own doctors or patients');
  const recipient = await User.findById(other).select('fullName');
  if (!recipient) throw notFound('User not found');

  const msg = await Message.create({ from: req.user._id, to: other, text });
  emitToUser(other, 'chat:message', msg);
  emitToUser(req.user._id, 'chat:message', msg);

  // Only notify if this is the first unread message from this sender, to avoid flooding the bell
  const unreadFromMe = await Message.countDocuments({ from: req.user._id, to: other, read: false });
  if (unreadFromMe === 1) {
    await notifyUsers([other], { type: 'message', title: `New message from ${req.user.fullName}`, message: text.slice(0, 120), link: `/app/messages?with=${req.user._id}` });
  }
  res.status(201).json(msg);
}
