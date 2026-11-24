import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    reason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

leaveSchema.index({ doctor: 1, date: 1 }, { unique: true });

export default mongoose.model('DoctorLeave', leaveSchema);
