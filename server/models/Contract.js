import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  businessType: {
    type: String,
    required: true
  },
  contractType: {
    type: String,
    enum: ['Buying', 'Selling'],
    required: true
  },
  commodity: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  offerValue: {
    type: Number,
    required: true
  },
  intervalType: {
    type: String,
    enum: ['Daily', 'Weekly'],
    required: true
  },
  intervalValue: {
    type: Number,
    required: true
  },
  deliveryInterval: {
    type: Number,
    default: 1
  },
  deliveryIntervalUnit: {
    type: String,
    enum: ['Hours', 'Minutes', 'Days', 'Weeks'],
    default: 'Days'
  },
  duration: {
    type: Number,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  lateDeliveryPenalty: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['Open', 'Accepted', 'Expired', 'Cancelled', 'Completed'],
    default: 'Open'
  },
  agreementId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  acceptedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  completionStatistics: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
