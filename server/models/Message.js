import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  receiverCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  type: {
    type: String,
    enum: ['Text', 'Contract Reference', 'Agreement Proposal', 'Agreement Timeline'],
    default: 'Text',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contractRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  agreementRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agreement',
    default: null
  },
  readStatus: {
    type: String,
    enum: ['Sent', 'Delivered', 'Read'],
    default: 'Sent',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
