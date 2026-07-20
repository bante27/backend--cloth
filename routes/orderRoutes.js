const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const { 
    addOrderItems, 
    getOrderById, 
    updateOrderToPaid, 
    updateOrderToDelivered, 
    getOrders, 
    getMyOrders,
    updateOrderToShipped,
    updateOrderToDeliveredByClient,
    validateCoupon
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ storage });

// --- STATIC / SPECIFIC ROUTES (Must go first!) ---
router.post('/validate-coupon', protect, validateCoupon); // Added protect middleware for security
router.post('/', protect, upload.single('image'), addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, adminOnly, getOrders);

// --- DYNAMIC PARAMETER ROUTES (Must go last!) ---
router.get('/:id', protect, getOrderById);
router.put('/:id/deliver', protect, updateOrderToDelivered); 
router.put('/:id/deliver-client', protect, updateOrderToDeliveredByClient); 
router.put('/:id/pay', protect, adminOnly, updateOrderToPaid);
router.put('/:id/ship', protect, adminOnly, updateOrderToShipped); 

module.exports = router;