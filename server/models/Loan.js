import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: [true, 'Startup reference is required']
  },
  loanType: {
    type: String,
    enum: ['Working Capital Loan', 'Expansion Loan', 'Emergency Loan'],
    required: [true, 'Loan type is required']
  },
  purpose: {
    type: String,
    enum: ['Working Capital', 'Expansion', 'Inventory', 'Research', 'Other'],
    required: [true, 'Loan purpose is required']
  },
  amount: {
    type: Number,
    required: [true, 'Loan amount is required']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration in months is required']
  },
  remainingDuration: {
    type: Number,
    required: [true, 'Remaining duration is required']
  },
  monthlyEmi: {
    type: Number,
    required: [true, 'Monthly EMI amount is required']
  },
  outstandingBalance: {
    type: Number,
    required: [true, 'Outstanding balance is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Fully Repaid', 'Defaulted'],
    default: 'Active'
  },
  missedPaymentsCount: {
    type: Number,
    default: 0
  },
  nextEmiDate: {
    type: Date,
    required: [true, 'Next EMI date is required']
  },
  history: [
    {
      paymentDate: { type: Date, default: Date.now },
      type: { type: String, enum: ['EMI', 'Early Repayment', 'Late Fee'], default: 'EMI' },
      amount: { type: Number, required: true },
      principalPaid: { type: Number, required: true },
      interestPaid: { type: Number, required: true },
      status: { type: String, enum: ['Paid', 'Missed', 'Defaulted'], default: 'Paid' },
      balanceAfter: { type: Number, required: true }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
