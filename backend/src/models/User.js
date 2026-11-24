import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['Admin', 'Doctor', 'Staff', 'Patient'];

const scheduleSchema = new mongoose.Schema(
  {
    days: [{ type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }],
    startHour: { type: Number, min: 0, max: 23, default: 9 },
    endHour: { type: Number, min: 1, max: 24, default: 17 },
    // Optional separate hours for video visits (e.g. 18–22). Unset = same as in-person hours.
    videoStartHour: { type: Number, min: 0, max: 23 },
    videoEndHour: { type: Number, min: 1, max: 24 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'Patient' },
    contactNumber: { type: String, default: '' },
    age: { type: Number, min: 0, max: 130 },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    address: { type: String, default: '' },
    // Doctor-only fields
    specialization: { type: String, default: '' },
    consultationFee: { type: Number, default: 0, min: 0 },
    bio: { type: String, default: '' },
    schedule: { type: scheduleSchema, default: undefined },
    // Payroll (employees only)
    salary: { type: Number, default: 0, min: 0 }, // monthly base salary
    commissionRate: { type: Number, default: 0, min: 0, max: 100 }, // doctors: % of consultation revenue
    // Password reset (stored hashed, never returned)
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    lastLoginAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
