import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: [true, 'Startup reference is required']
  },
  transactionType: {
    type: String,
    enum: ['Purchase', 'Sale', 'Production'],
    required: [true, 'Transaction type is required']
  },
  buyerStartupName: {
    type: String,
    default: null
  },
  sellerStartupName: {
    type: String,
    default: null
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  pricePerUnit: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
