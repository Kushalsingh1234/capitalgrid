import mongoose from 'mongoose';

const governmentAccountSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true
  },
  corporateTaxCollected: {
    type: Number,
    default: 0
  },
  payrollTaxCollected: {
    type: Number,
    default: 0
  },
  vatCollected: {
    type: Number,
    default: 0
  },
  governmentBalance: {
    type: Number,
    default: 0
  },
  subsidiesPaid: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const GovernmentAccount = mongoose.model('GovernmentAccount', governmentAccountSchema);
export default GovernmentAccount;
