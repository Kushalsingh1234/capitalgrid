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
  banner: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  level: {
    type: Number,
    default: 1
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
  creditRating: {
    type: String,
    enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D'],
    default: 'BBB'
  },
  productionSpeedMultiplier: {
    type: Number,
    default: 1.0
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
  retailInventory: {
    type: Array,
    default: []
  },
  retailState: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      status: 'Open',
      reputation: 0.82,
      activeCycle: {
        status: 'Idle',
        startTime: null,
        endTime: null,
        duration: 0,
        expectedRevenue: 0,
        expectedProfit: 0,
        expectedCustomers: 0,
        expectedSales: {},
        lockedQuantities: {}
      },
      history: []
    }
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
