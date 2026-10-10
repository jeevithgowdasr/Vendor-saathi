import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fullName: { type: String },
    phone: { type: String, required: true, unique: true, sparse: true },
    email: { type: String, sparse: true },
    passwordHash: { type: String },
    addresses: [
      {
        tag: String,
        name: String,
        phone: String,
        address: String,
        isDefault: Boolean
      }
    ],
    role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'blocked', 'pending_approval'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
