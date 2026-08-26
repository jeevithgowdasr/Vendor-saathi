import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['online', 'busy', 'offline'], default: 'online' },
  locationName: { type: String, required: true },
  distanceKm: { type: Number, required: true },
  rating: { type: Number, default: 4.7 },
  reviewCount: { type: Number, default: 120 },
  deliveryTime: { type: String, default: '20–30 min delivery' },
  categories: [String],
  image: String,
  avatar: String,
  address: String,
  verified: { type: Boolean, default: true }
});

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
