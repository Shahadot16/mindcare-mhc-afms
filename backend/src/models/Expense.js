import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Equipment', 'Medical Supplies', 'Maintenance', 'Marketing', 'Software', 'Other'];

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true }, // YYYY-MM-DD
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });

export default mongoose.model('Expense', expenseSchema);
