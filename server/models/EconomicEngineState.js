import mongoose from 'mongoose';

const EconomicEngineStateSchema = new mongoose.Schema({
  lastProcessedHour: {
    type: Date,
    required: true,
    default: () => new Date('2026-07-01T00:00:00.000Z')
  },
  lastProcessedDay: {
    type: Date,
    required: true,
    default: () => new Date('2026-07-01T00:00:00.000Z')
  },
  lastProcessedWeek: {
    type: Date,
    required: true,
    default: () => new Date('2026-07-01T00:00:00.000Z')
  },
  lastProcessedMonth: {
    type: Date,
    required: true,
    default: () => new Date('2026-07-01T00:00:00.000Z')
  },
  lastProcessedYear: {
    type: Date,
    required: true,
    default: () => new Date('2026-07-01T00:00:00.000Z')
  }
}, { timestamps: true });

export default mongoose.model('EconomicEngineState', EconomicEngineStateSchema);
