import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  companyA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true,
    index: true
  },
  companyB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['Contract Inquiry', 'Business Inquiry', 'Delivery Discussion', 'Contract Dispute'],
    default: 'Business Inquiry',
    required: true
  },
  unreadBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    default: []
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Future Compatibility Reserved Architecture Fields
  agreementProposal: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  counterOffer: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  digitalSignature: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  deliveryNotices: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  systemMessages: {
    type: Array,
    default: []
  },
  notifications: {
    type: Array,
    default: []
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
