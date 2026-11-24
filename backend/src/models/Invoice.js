import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ['Consultation', 'Test', 'Discount'], required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [lineItemSchema],
    consultationAmount: { type: Number, default: 0 }, // after discount
    testsAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true }, // total payable
    note: { type: String, default: '' },
    status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    dueDate: { type: String, required: true },
    paidAt: Date,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);
