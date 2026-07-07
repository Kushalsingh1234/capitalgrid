import mongoose from 'mongoose';

const WorldClockSchema = new mongoose.Schema({
  gameStartDate: {
    type: Date,
    required: true,
    default: () => new Date('2026-07-01T00:00:00.000Z')
  },
  speedMultiplier: {
    type: Number,
    required: true,
    default: 30
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('WorldClock', WorldClockSchema);
