import mongoose from 'mongoose';

const productionTaskSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Producing', 'Completed'],
    default: 'Producing'
  },
  duration: { type: Number, required: true }
}, { timestamps: true });

const ProductionTask = mongoose.model('ProductionTask', productionTaskSchema);
export default ProductionTask;
