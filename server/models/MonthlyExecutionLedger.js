import mongoose from 'mongoose';

const MonthlyExecutionLedgerSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  gameMonth: {
    type: Number,
    required: true
  },
  gameYear: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['Payroll', 'Tax']
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate records for the same startup + game period + action
MonthlyExecutionLedgerSchema.index({ startupId: 1, gameMonth: 1, gameYear: 1, action: 1 }, { unique: true });

export default mongoose.model('MonthlyExecutionLedger', MonthlyExecutionLedgerSchema);
