import mongoose from 'mongoose';

export const APPOINTMENT_STATUS = ['Pending', 'Approved', 'Completed', 'Cancelled'];
export const TEST_STATUS = ['Suggested', 'Accepted', 'Rejected', 'Completed'];

const appointmentTestSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalTest', required: true },
  testName: { type: String, required: true }, // snapshot, so later price/name edits don't rewrite history
  price: { type: Number, required: true },
  status: { type: String, enum: TEST_STATUS, default: 'Suggested' },
  completedAt: Date,
  result: { type: String, default: '' },
});

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUS, default: 'Pending' },
    // true while the slot is taken; false once cancelled so the slot frees up
    holdsSlot: { type: Boolean, default: true },
    description: { type: String, default: '' }, // reason for visit
    diagnosis: { type: String, default: '' },
    prescription: { type: String, default: '' },
    followUpDate: { type: String, default: '' },
    consultationFee: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    isInvoiceGenerated: { type: Boolean, default: false },
    tests: [appointmentTestSchema],
    cancelledBy: { type: String, default: '' },
    reminderSent: { type: Boolean, default: false },
    // Video consultation
    mode: { type: String, enum: ['In-person', 'Video'], default: 'In-person' },
    call: {
      patientJoinedAt: Date, // first time the patient entered the waiting room
      startedAt: Date, // doctor admitted the patient
      endedAt: Date,
      durationSec: { type: Number, default: 0 },
      endedBy: { type: String, default: '' }, // Doctor | Patient | Time limit
    },
    reminder1hSent: { type: Boolean, default: false },
    reminder10mSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One active booking per doctor per slot: the database itself prevents double-booking.
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { holdsSlot: true } }
);
appointmentSchema.index({ patient: 1, date: -1 });

export default mongoose.model('Appointment', appointmentSchema);
