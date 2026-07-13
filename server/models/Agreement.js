import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  contractRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
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
    default: 'Daily'
  },
  intervalValue: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number, // Total deliveries expected
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  lateDeliveryPenalty: {
    type: Number,
    default: 0
  },
  earlyTerminationCompensation: {
    type: Number,
    default: 0
  },
  specialNotes: {
    type: String,
    default: ''
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Countered', 'Accepted', 'Rejected', 'Cancelled', 'Active', 'Completed', 'Expired', 'Terminated'],
    default: 'Pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  agreementGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  progress: {
    type: Number, // Deliveries completed (starts at 0)
    default: 0
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  acceptedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastDeliveryAt: {
    type: Date
  },
  nextDeliveryAt: {
    type: Date
  },
  deliveryInterval: {
    type: Number,
    default: 24
  },
  deliveryIntervalUnit: {
    type: String,
    enum: ['Hours', 'Minutes', 'Days', 'Weeks'],
    default: 'Days'
  },
  terminationReason: {
    type: String,
    default: ''
  },
  remainingContractValue: {
    type: Number,
    default: 0
  },
  compensationPaid: {
    type: Number,
    default: 0
  },
  terminatedAt: {
    type: Date
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  },
  compensationStatus: {
    type: String,
    enum: ['None', 'Pending', 'Charged', 'Waived'],
    default: 'None'
  },
  completedAt: {
    type: Date
  },
  timeZone: {
    type: String,
    default: 'UTC'
  }
}, { timestamps: true });

const Agreement = mongoose.model('Agreement', agreementSchema);
export default Agreement;
