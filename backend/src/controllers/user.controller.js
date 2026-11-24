import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { DAYS } from '../utils/time.js';
import { audit } from '../services/audit.service.js';

// GET /api/users?role=Doctor&search=
export async function listUsers(req, res) {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }, { specialization: rx }];
  }
  const users = await User.find(filter).sort({ role: 1, fullName: 1 });
  res.json(users);
}

// POST /api/users  (Admin hires Doctor / Staff / Admin)
export async function createUser(req, res) {
  const { fullName, email, password, role, specialization, consultationFee, contactNumber, gender, address } = req.body;
  if (!fullName || !email || !password) throw badRequest('Name, email and password are required');
  if (!['Doctor', 'Staff', 'Admin'].includes(role)) throw badRequest('Role must be Doctor, Staff or Admin');
  if (password.length < 6) throw badRequest('Password must be at least 6 characters');

  const data = {
    fullName, email, password, role, contactNumber, gender: gender || '', address,
    salary: Number(req.body.salary) || 0, commissionRate: role === 'Doctor' ? Number(req.body.commissionRate) || 0 : 0,
  };
  if (role === 'Doctor') {
    if (!specialization) throw badRequest('Specialization is required for doctors');
    Object.assign(data, {
      specialization,
      consultationFee: Number(consultationFee) || 0,
      schedule: { days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], startHour: 9, endHour: 17 },
    });
  }
  const user = await User.create(data);
  await audit(req, 'user.create', { entity: 'User', entityId: user._id, summary: `Hired ${user.fullName} as ${user.role}` });
  res.status(201).json(user);
}

// PUT /api/users/:id
export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');

  if (String(user._id) === String(req.user._id) && req.body.isActive === false) throw badRequest('You cannot deactivate your own account');
  const fields = ['fullName', 'email', 'contactNumber', 'gender', 'address', 'isActive'];
  if (user.role !== 'Patient') fields.push('salary');
  if (user.role === 'Doctor') fields.push('specialization', 'consultationFee', 'bio', 'commissionRate');
  for (const f of fields) if (req.body[f] !== undefined) user[f] = req.body[f];
  if (req.body.password) {
    if (req.body.password.length < 6) throw badRequest('Password must be at least 6 characters');
    user.password = req.body.password;
  }
  await user.save();
  const what = req.body.isActive !== undefined && Object.keys(req.body).length === 1
    ? (user.isActive ? 'Reactivated' : 'Deactivated') : 'Updated';
  await audit(req, what === 'Updated' ? 'user.update' : 'user.status', { entity: 'User', entityId: user._id, summary: `${what} ${user.fullName}` });
  res.json(user);
}

// DELETE /api/users/:id
export async function deleteUser(req, res) {
  if (String(req.params.id) === String(req.user._id)) throw badRequest('You cannot delete your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');

  // Keep history intact: users with appointments are deactivated instead of deleted.
  const hasHistory = await Appointment.exists({ $or: [{ doctor: user._id }, { patient: user._id }] });
  if (hasHistory) {
    user.isActive = false;
    await user.save();
    await audit(req, 'user.status', { entity: 'User', entityId: user._id, summary: `Deactivated ${user.fullName} (has history)` });
    return res.json({ message: `${user.fullName} has appointment history, so the account was deactivated instead of deleted` });
  }
  await user.deleteOne();
  await audit(req, 'user.delete', { entity: 'User', entityId: user._id, summary: `Removed ${user.fullName} (${user.role})` });
  res.json({ message: `${user.fullName} was removed` });
}

// PUT /api/users/:id/schedule
export async function updateSchedule(req, res) {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'Doctor') throw notFound('Doctor not found');

  const days = (req.body.days || []).filter((d) => DAYS.includes(d));
  const startHour = Number(req.body.startHour);
  const endHour = Number(req.body.endHour);
  if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour) {
    throw badRequest('Start hour must be before end hour');
  }
  // Optional separate video consultation hours; empty means "same as working hours"
  const schedule = { days, startHour, endHour };
  const hasVideo = req.body.videoStartHour !== undefined && req.body.videoStartHour !== null && req.body.videoStartHour !== '';
  if (hasVideo) {
    const vs = Number(req.body.videoStartHour);
    const ve = Number(req.body.videoEndHour);
    if (!Number.isInteger(vs) || !Number.isInteger(ve) || vs < 0 || ve > 24 || vs >= ve) {
      throw badRequest('Video start hour must be before video end hour');
    }
    Object.assign(schedule, { videoStartHour: vs, videoEndHour: ve });
  }
  user.schedule = schedule;
  await user.save();
  await audit(req, 'user.schedule', { entity: 'User', entityId: user._id, summary: `${user.fullName}: ${days.map((d) => d.slice(0, 3)).join(', ')} ${startHour}:00–${endHour}:00${hasVideo ? `, video ${schedule.videoStartHour}:00–${schedule.videoEndHour}:00` : ''}` });
  res.json(user);
}
