import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  addresses: [{
    tag: String,
    name: String,
    phone: String,
    address: String,
    isDefault: Boolean
  }],
  role: { type: String, default: 'customer' },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
