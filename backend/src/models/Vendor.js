import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const vendorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    // Backwards-compatible alias for existing controllers
    name: {
      type: String,
      trim: true
    },
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
    businessName: {
      type: String,
      required: [true, 'Business or Shop name is required'],
      trim: true
    },
    // Primary vendor category
    vendorCategory: {
      type: String,
      required: [true, 'Vendor category is required'],
      default: 'Vegetables'
    },
    // Array of categories supported
    categories: {
      type: [String],
      default: ['Vegetables', 'Fruits', 'Daily Essentials']
    },
    // Supported operating localities
    operatingAreas: {
      type: [String],
      required: [true, 'At least one operating area is required'],
      default: ['Mijar', 'Moodbidri']
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    // Backwards-compatible alias
    avatar: {
      type: String
    },
    // Optional Vehicle Details
    vehicleDetails: {
      vehicleType: {
        type: String,
        enum: ['Cart', 'Bicycle', 'Two-Wheeler', 'Three-Wheeler / Auto', 'Van / Small Truck', 'None', 'Other'],
        default: 'None'
      },
      registrationNumber: {
        type: String,
        default: '',
        trim: true
      }
    },
    status: {
      type: String,
      enum: ['pending_approval', 'active', 'blocked'],
      default: 'active'
    },
    role: {
      type: String,
      default: 'vendor',
      immutable: true
    },
    // Additional operational & marketplace details
    locationName: {
      type: String,
      default: 'Mijar Cross, Moodbidri'
    },
    address: {
      type: String,
      default: 'Mijar Cross, Moodbidri - 574225'
    },
    coordinates: {
      lat: { type: Number, default: 13.0682 },
      lng: { type: Number, default: 74.9961 }
    },
    distanceKm: {
      type: Number,
      default: 1.8
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviewCount: {
      type: Number,
      default: 120
    },
    deliveryTime: {
      type: String,
      default: '20–30 min delivery'
    },
    verified: {
      type: Boolean,
      default: true
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to populate aliases
vendorSchema.pre('save', function (next) {
  if (!this.name) this.name = this.businessName || this.fullName;
  if (!this.avatar) this.avatar = this.profileImage;
  next();
});

// Compare password method
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Sanitize vendor object for JSON responses
vendorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
