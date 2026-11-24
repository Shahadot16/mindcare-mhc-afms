import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['PHQ9', 'GAD7'], required: true },
    answers: [{ type: Number, min: 0, max: 3 }],
    score: { type: Number, required: true },
    severity: { type: String, required: true },
    riskFlag: { type: Boolean, default: false }, // PHQ-9 item 9 (thoughts of self-harm) answered above 0
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Assessment', assessmentSchema);
