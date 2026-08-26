import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  town: { type: String, required: true },
  district: { type: String, required: true },
  pincode: { type: String, required: true },
  vendorsCount: { type: Number, default: 4 }
});

export const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);
