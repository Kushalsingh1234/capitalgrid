import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Tax', 'Payroll', 'MarketSale', 'MarketPurchase', 'Production', 'Retail', 'Welcome', 'HR']
  },
  amount: {
    type: Number,
    default: 0
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
