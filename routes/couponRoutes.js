const express = require('express');
const router = express.Router();
const { subscribeUser, verifyCoupon } = require('../controllers/couponController');

// 🎟️ Endpoint: POST /api/coupons/subscribe
// Purpose: Handles newsletter subscription, generates the discount coupon, and triggers the welcome email.
router.post('/subscribe', subscribeUser);

// 🔍 Endpoint: POST /api/coupons/verify
// Purpose: Checks if a coupon is valid, active, and matching the user's email during checkout.
router.post('/verify', verifyCoupon);

module.exports = router;