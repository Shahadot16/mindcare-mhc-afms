import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    role: String,
    baseSalary: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 }, // percent
    commissionBase: { type: Number, default: 0 }, // consultation revenue the commission is computed on
    commission: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const payrollSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, unique: true }, // YYYY-MM
    entries: [entrySchema],
    total: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Paid'], default: 'Draft' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('PayrollRun', payrollSchema);
