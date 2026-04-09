const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

// NEW: variant schema for color + its images + optional stock per color
const variantSchema = mongoose.Schema({
  color: { type: String, required: true },          // e.g. "Black", "Red"
  imageFront: { type: String, required: true },
  imageBack: { type: String, default: '' },
  imageSide: { type: String, default: '' },
  imageDetail: { type: String, default: '' },
  // You can also add stock per color if needed, but we keep global countInStock for simplicity
});

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex', 'Kids'], required: true },
  countInStock: { type: Number, required: true, default: 0 }, // total stock across all colors
  // Legacy fields – kept for backward compatibility, but will be overridden by selected variant
  imageFront: { type: String, required: true },
  imageBack: { type: String, default: '' },
  imageSide: { type: String, default: '' },
  imageDetail: { type: String, default: '' },
  isNew: { type: Boolean, default: false },
  sizes: [{ type: String }],
  colors: [{ type: String }],   // simple list of available colors (for filter & buttons)
  variants: [variantSchema],    // NEW: actual images per color
  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;