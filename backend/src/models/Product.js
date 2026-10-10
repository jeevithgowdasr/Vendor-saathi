import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: String,
      required: [true, 'Vendor ID is required'],
      index: true
    },
    // Backwards-compatible alias for existing controllers
    vendorId: {
      type: String,
      index: true
    },
    vendorName: {
      type: String,
      default: 'Local Merchant'
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    shortName: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price must be positive']
    },
    originalPrice: {
      type: Number
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true
    },
    available_quantity: {
      type: Number,
      default: 10,
      min: [0, 'Available quantity cannot be negative']
    },
    // Backwards-compatible alias
    availableStock: {
      type: Number,
      default: 10
    },
    is_available: {
      type: Boolean,
      default: true,
      index: true
    },
    stockStatus: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock'],
      default: 'in-stock'
    },
    image_url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'
    },
    // Backwards-compatible alias
    image: {
      type: String
    },
    description: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.8
    },
    reviewCount: {
      type: Number,
      default: 12
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for id
productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Pre-save hook to synchronize aliases
productSchema.pre('save', function (next) {
  if (!this.vendorId) this.vendorId = this.vendor_id;
  if (!this.vendor_id) this.vendor_id = this.vendorId;

  if (this.available_quantity !== undefined) {
    this.availableStock = this.available_quantity;
  } else if (this.availableStock !== undefined) {
    this.available_quantity = this.availableStock;
  }

  if (this.is_available !== undefined) {
    this.stockStatus = this.is_available ? (this.available_quantity <= 2 ? 'low-stock' : 'in-stock') : 'out-of-stock';
  } else if (this.stockStatus) {
    this.is_available = this.stockStatus !== 'out-of-stock';
  }

  if (!this.image && this.image_url) this.image = this.image_url;
  if (!this.image_url && this.image) this.image_url = this.image;

  if (!this.shortName && this.name) this.shortName = this.name.split(' ')[0];

  next();
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
