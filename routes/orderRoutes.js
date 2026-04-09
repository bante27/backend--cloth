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
    updateOrderToDeliveredByClient
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ storage });

// --- USER ROUTES ---
router.post('/', protect, upload.single('image'), addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.put('/:id/deliver', protect, updateOrderToDelivered); // Customer marks as delivered
router.put('/:id/deliver-client', protect, updateOrderToDeliveredByClient); // New route for client to mark as delivered
// --- ADMIN & SHARED ROUTES ---
router.get('/', protect, adminOnly, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, adminOnly, updateOrderToPaid);
router.put('/:id/ship', protect, adminOnly, updateOrderToShipped); // Admin marks as shipped
module.exports = router;