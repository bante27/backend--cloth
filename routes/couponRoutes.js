const express = require('express');
const router = express.Router();
const { 
  subscribeUser, 
  verifyCoupon, 
  checkSubscriptionStatus 
} = require('../controllers/couponController');

// 📊 Endpoint: GET /api/coupons/status
// Purpose: Checks if the current IP address is already subscribed
router.get('/status', checkSubscriptionStatus);

// 🎟️ Endpoint: POST /api/coupons/subscribe
// Purpose: Handles newsletter subscription, generates the discount coupon, and triggers the welcome email.
router.post('/subscribe', subscribeUser);

// 🔍 Endpoint: POST /api/coupons/verify
// Purpose: Checks if a coupon is valid, active, and matching the user's email during checkout.
router.post('/verify', verifyCoupon);

module.exports = router;
