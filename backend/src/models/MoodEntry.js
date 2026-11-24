import mongoose from 'mongoose';

export const EMOTIONS = ['Happy', 'Calm', 'Grateful', 'Hopeful', 'Tired', 'Anxious', 'Sad', 'Angry', 'Lonely', 'Stressed', 'Overwhelmed', 'Numb'];

const moodSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD, one entry per day
    mood: { type: Number, min: 1, max: 5, required: true }, // 1 = very low, 5 = great
    emotions: [{ type: String, enum: EMOTIONS }],
    sleepHours: { type: Number, min: 0, max: 24 },
    anxiety: { type: Number, min: 0, max: 10 },
    note: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

moodSchema.index({ patient: 1, date: 1 }, { unique: true });

export default mongoose.model('MoodEntry', moodSchema);
