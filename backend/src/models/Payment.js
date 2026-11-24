import mongoose from 'mongoose';

export const PAYMENT_METHODS = ['Card', 'bKash', 'Nagad', 'Rocket'];

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    // Only a masked reference is stored. This is a simulated gateway: no real card/wallet data is kept.
    accountRef: { type: String, default: '' },
    transactionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
