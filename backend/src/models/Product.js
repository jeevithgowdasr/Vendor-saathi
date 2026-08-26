import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  unit: { type: String, required: true },
  availableStock: { type: Number, required: true },
  stockStatus: { type: String, enum: ['in-stock', 'low-stock', 'out-of-stock'], default: 'in-stock' },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  rating: { type: Number, default: 4.7 },
  reviewCount: { type: Number, default: 100 },
  image: String,
  description: String
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
