import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
  startupName: {
    type: String,
    required: [true, 'Startup name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Startup name must be at least 3 characters'],
    maxlength: [30, 'Startup name must be at most 30 characters']
  },
  startupId: {
    type: String,
    required: [true, 'System generated Startup ID is required'],
    unique: true,
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Base country location is required']
  },
  industry: {
    type: String,
    required: [true, 'Industry category classification is required']
  },
  businessType: {
    type: String,
    required: [true, 'Business type subcategory is required']
  },
  logo: {
    type: String,
    default: ''
  },
  startingCapital: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  inventory: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active'
  },
  employeesLaidOff: {
    type: Number,
    default: 0
  },
  employeesRecruited: {
    type: Number,
    default: 0
  },
  employeeMorale: {
    type: Number,
    default: 100
  },
  recentPayroll: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  outstandingTax: {
    type: Number,
    default: 0
  },
  financials: {
    revenue: { type: Number, default: 0 },
    operatingExpenses: { type: Number, default: 0 },
    payrollExpense: { type: Number, default: 0 },
    productionExpense: { type: Number, default: 0 },
    marketplaceExpense: { type: Number, default: 0 },
    taxExpense: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    retainedEarnings: { type: Number, default: 0 }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One user can own exactly one startup
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Startup = mongoose.model('Startup', startupSchema);
export default Startup;
