const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  createProductReview 
} = require('../controllers/productController');

const upload = multer({ storage });

// Public Routes
// @desc    Get all products with filtering
router.get('/', getProducts);

// @desc    Get a single product by ID
router.get('/:id', getProductById);

/**
 * Admin Routes
 * -----------------------------------------------------------------------
 * Note: We use upload.any() because our controller expects dynamic field names
 * like variantImages[0][imageFront], variantImages[1][imageBack], etc.
 * upload.fields() cannot handle these indexed names dynamically.
 */

// @desc    Create a new product (Admin Only)
router.post('/', protect, adminOnly, upload.any(), createProduct);

// @desc    Update an existing product (Admin Only)
router.put('/:id', protect, adminOnly, upload.any(), updateProduct);

// @desc    Delete a product (Admin Only)
router.delete('/:id', protect, adminOnly, deleteProduct);

// @desc    Add a product review (Logged-in Users)
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;