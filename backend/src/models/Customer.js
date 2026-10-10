import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    // Either mobile number or email can serve as unique identifier
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    primaryLocation: {
      address: { type: String, default: 'Mijar, Moodbidri, Karnataka - 574225' },
      coordinates: {
        lat: { type: Number, default: 13.0682 },
        lng: { type: Number, default: 74.9961 }
      },
      village: { type: String, default: 'Mijar' },
      town: { type: String, default: 'Moodbidri' },
      district: { type: String, default: 'Dakshina Kannada' },
      pincode: { type: String, default: '574225' }
    },
    // Optional multi-select preferred localities
    preferredAreas: {
      type: [String],
      default: ['Mijar', 'Moodbidri']
    },
    // Optional multi-select preferred product categories
    preferredCategories: {
      type: [String],
      default: ['Vegetables', 'Fruits', 'Dairy']
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    },
    role: {
      type: String,
      default: 'customer',
      immutable: true
    }
  },
  {
    timestamps: true
  }
);

// Method to verify candidate password
customerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Sanitize user object for JSON responses (strip sensitive hashes)
customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
