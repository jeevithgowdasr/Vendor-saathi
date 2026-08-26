import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  orderId: { type: String },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  helpfulCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
