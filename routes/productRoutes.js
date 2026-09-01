const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const {
  getProductsSchema,
  getProductByIdSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  createProductReviewSchema,
  getNewArrivalsSchema,
  getLowestCostProductsSchema
} = require('../validation/productValidation');

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductReview,
  getNewArrivals,
  getLowestCostProducts
} = require('../controllers/productController');

const upload = multer({ storage });

// ==========================================
// 🔓 Public Routes
// ==========================================
router.get('/', validate(getProductsSchema), getProducts);
router.get('/new-arrivals', validate(getNewArrivalsSchema), getNewArrivals);
router.get('/lowest-cost', validate(getLowestCostProductsSchema), getLowestCostProducts);
router.get('/:id', validate(getProductByIdSchema), getProductById);

// ==========================================
// 🔒 Protected / Admin Routes
// ==========================================
router.post('/', protect, adminOnly, upload.any(), validate(createProductSchema), createProduct);
router.put('/:id', protect, adminOnly, upload.any(), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, adminOnly, validate(deleteProductSchema), deleteProduct);
router.post('/:id/reviews', protect, validate(createProductReviewSchema), createProductReview);

module.exports = router;
