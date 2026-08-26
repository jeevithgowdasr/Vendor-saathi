import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  vendorPhone: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  items: [{
    id: String,
    name: String,
    price: Number,
    unit: String,
    quantity: Number
  }],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 20 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Placed' },
  createdAt: { type: Date, default: Date.now }
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
