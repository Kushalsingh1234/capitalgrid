import mongoose from 'mongoose';

const marketplaceSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: [true, 'Seller Startup reference is required']
  },
  sellerStartupId: {
    type: String,
    required: [true, 'Seller Startup ID is required']
  },
  sellerStartupName: {
    type: String,
    required: [true, 'Seller Startup Name is required']
  },
  sellerCountry: {
    type: String,
    required: [true, 'Seller Country is required']
  },
  sellerCurrency: {
    type: String,
    required: [true, 'Seller Currency is required']
  },
  productId: {
    type: String,
    required: [true, 'Product ID is required']
  },
  commodity: {
    type: String,
    required: [true, 'Commodity identifier is required']
  },
  productName: {
    type: String,
    required: [true, 'Product Name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Listing quantity is required'],
    min: [1, 'Listing quantity must be at least 1']
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0.01, 'Price per unit must be at least 0.01']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0.01, 'Unit price must be at least 0.01']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Sold'],
    default: 'Active'
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    default: null
  },
  buyerStartupName: {
    type: String,
    default: null
  },
  listedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Marketplace = mongoose.model('Marketplace', marketplaceSchema);
export default Marketplace;
