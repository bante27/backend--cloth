const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      size: { type: String, required: true },
      color: { type: String, required: true }
    }
  ],
  shippingAddress: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentScreenshot: { type: String },
  totalPrice: { type: Number, required: true, default: 0.0 },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isShipped: { type: Boolean, required: true, default: false },
  shippedAt: { type: Date },
  isDelivered: { type: Boolean, default: false },               // ✅ added
  deliveredAt: { type: Date },                                 // ✅ added
  expectedDeliveryStart: { type: Date },                       // ✅ added
  expectedDeliveryEnd: { type: Date },                         // ✅ added
  status: { type: String, default: 'Pending Verification' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);