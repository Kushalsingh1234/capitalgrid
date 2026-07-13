import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  agreementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
    required: true,
    index: true
  },
  deliveryNumber: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'AutoAccepted'],
    default: 'Pending',
    required: true
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  sentAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  decidedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;
