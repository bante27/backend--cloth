const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const validate = require('../middleware/validationMiddleware');
const {
    addOrderItemsSchema,
    updateOrderToPaidSchema,
    updateOrderToShippedSchema,
    updateOrderToDeliveredSchema,
    getOrdersSchema,
    getOrderByIdSchema,
    getMyOrdersSchema,
    updateOrderToDeliveredByClientSchema,
    validateCouponSchema
} = require('../validation/orderValidation');

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
router.post('/validate-coupon', protect, validate(validateCouponSchema), validateCoupon);
router.post('/', protect, upload.single('image'), validate(addOrderItemsSchema), addOrderItems);
router.get('/myorders', protect, validate(getMyOrdersSchema), getMyOrders);
router.get('/', protect, adminOnly, validate(getOrdersSchema), getOrders);
router.get('/:id', protect, validate(getOrderByIdSchema), getOrderById);
router.put('/:id/deliver', protect, validate(updateOrderToDeliveredSchema), updateOrderToDelivered);
router.put('/:id/deliver-client', protect, validate(updateOrderToDeliveredByClientSchema), updateOrderToDeliveredByClient);
router.put('/:id/pay', protect, adminOnly, validate(updateOrderToPaidSchema), updateOrderToPaid);
router.put('/:id/ship', protect, adminOnly, validate(updateOrderToShippedSchema), updateOrderToShipped);

module.exports = router;

