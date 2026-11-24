import mongoose from 'mongoose';

const medicalTestSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('MedicalTest', medicalTestSchema);
