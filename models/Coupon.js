const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10 // Default 10% off
  },
  associatedEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
  }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);