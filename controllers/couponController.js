const couponService = require('../services/couponService');
const catchAsync = require('../utils/catchAsync');

exports.checkSubscriptionStatus = catchAsync(async (req, res) => {
    const result = await couponService.checkSubscriptionStatus(req);
    return res.status(200).json({
        success: true,
        ...result
    });
});

exports.subscribeUser = catchAsync(async (req, res) => {
    const result = await couponService.subscribeUser(req);
    return res.status(201).json({
        success: true,
        ...result
    });
});

exports.verifyCoupon = catchAsync(async (req, res) => {
    const result = await couponService.verifyCoupon(req.body);
    return res.status(200).json({
        success: true,
        ...result
    });
});
