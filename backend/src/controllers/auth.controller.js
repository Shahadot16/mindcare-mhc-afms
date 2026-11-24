import crypto from 'node:crypto';
import { sendMail, mailEnabled } from '../services/mail.service.js';
import { audit } from '../services/audit.service.js';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.middleware.js';
import { badRequest, HttpError } from '../utils/httpError.js';

const sendAuth = (res, user, status = 200) => {
  res.status(status).json({ token: signToken(user), user });
};

// POST /api/auth/register  (public sign-up is always a Patient account)
export async function register(req, res) {
  const { fullName, email, password, confirmPassword, age, gender, contactNumber, address } = req.body;
  if (!fullName || !email || !password) throw badRequest('Name, email and password are required');
  if (password.length < 6) throw badRequest('Password must be at least 6 characters');
  if (confirmPassword !== undefined && password !== confirmPassword) throw badRequest('Passwords do not match');

  const user = await User.create({
    fullName, email, password, age: age || undefined, gender: gender || '', contactNumber, address, role: 'Patient',
  });
  sendAuth(res, user, 201);
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw badRequest('Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new HttpError(401, 'Invalid email or password');
  if (!user.isActive) throw new HttpError(403, 'This account has been disabled');
  user.lastLoginAt = new Date();
  await user.save();
  sendAuth(res, user);
}

// GET /api/auth/me
export async function me(req, res) {
  res.json({ user: req.user });
}

// PUT /api/auth/profile
export async function updateProfile(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  const allowed = ['fullName', 'contactNumber', 'age', 'gender', 'address'];
  if (user.role === 'Doctor') allowed.push('bio');
  for (const key of allowed) if (req.body[key] !== undefined) user[key] = req.body[key];

  const { currentPassword, newPassword } = req.body;
  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword))) throw badRequest('Current password is incorrect');
    if (newPassword.length < 6) throw badRequest('New password must be at least 6 characters');
    user.password = newPassword;
  }
  await user.save();
  res.json({ user });
}

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// POST /api/auth/forgot-password  { email }
// Always answers the same way, so it can't be used to discover which emails have accounts.
export async function forgotPassword(req, res) {
  const email = String(req.body.email || '').toLowerCase().trim();
  const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
  const user = email && await User.findOne({ email, isActive: true });
  if (!user) return res.json(generic);

  const token = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();

  const url = `${(process.env.CLIENT_URL || 'http://localhost:5180').split(',')[0]}/reset-password/${token}`;
  await sendMail({
    to: user.email, subject: 'Reset your MindCare password', title: 'Password reset',
    html: `<p>Hi ${user.fullName},</p><p>Click the link below to choose a new password. It expires in 30 minutes.</p><p><a href="${url}">${url}</a></p><p>If you didn't ask for this, you can ignore this email.</p>`,
  });
  // In local development without SMTP, hand the link back so the flow can be tested.
  const devLink = !mailEnabled() && process.env.NODE_ENV !== 'production' ? { devResetUrl: url } : {};
  res.json({ ...generic, ...devLink });
}

// POST /api/auth/reset-password  { token, password }
export async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token) throw badRequest('Reset link is invalid');
  if (!password || password.length < 6) throw badRequest('Password must be at least 6 characters');
  const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } })
    .select('+resetTokenHash +resetTokenExpires');
  if (!user) throw badRequest('This reset link is invalid or has expired. Please request a new one');
  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  await audit({ user, ip: req.ip }, 'auth.password.reset', { entity: 'User', entityId: user._id, summary: user.email });
  sendAuth(res, user);
}
