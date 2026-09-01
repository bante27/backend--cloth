const express = require('express');
const router = express.Router();
const validate = require('../middleware/validationMiddleware');
const {
    subscribeSchema,
    verifyCouponSchema,
    checkStatusSchema
} = require('../validation/couponValidation');
const { 
  subscribeUser, 
  verifyCoupon, 
  checkSubscriptionStatus 
} = require('../controllers/couponController');

router.get('/status', validate(checkStatusSchema), checkSubscriptionStatus);
router.post('/subscribe', validate(subscribeSchema), subscribeUser);
router.post('/verify', validate(verifyCouponSchema), verifyCoupon);

module.exports = router;
