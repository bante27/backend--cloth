const Subscriber = require('../models/Subscriber');
const Coupon = require('../models/Coupon');
const { sendWelcomeEmail } = require('../utils/sendEmail');
const AppError = require('../utils/appError');

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || req.ip;
};

class CouponService {
    async checkSubscriptionStatus(req) {
        const clientIp = getClientIp(req);
        const existingSubscriber = await Subscriber.findOne({ ipAddress: clientIp });

        return {
            subscribed: !!existingSubscriber,
            email: existingSubscriber ? existingSubscriber.email : null
        };
    }

    async subscribeUser(req) {
        const { email } = req.body;
        const clientIp = getClientIp(req);

        if (!email) {
            throw new AppError('Email field is strictly required.', 400);
        }

        const existingSubscriber = await Subscriber.findOne({
            $or: [{ email }, { ipAddress: clientIp }]
        });

        if (existingSubscriber) {
            throw new AppError('This email or device is already subscribed.', 400);
        }

        const newSubscriber = new Subscriber({ email, ipAddress: clientIp });
        await newSubscriber.save();

        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const discountAmount = 15;
        const uniqueCouponCode = `HW${discountAmount}-${randomSuffix}`;

        const newCoupon = new Coupon({
            code: uniqueCouponCode,
            discountPercentage: discountAmount,
            associatedEmail: email,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await newCoupon.save();

        try {
            await sendWelcomeEmail(email, uniqueCouponCode, discountAmount);
        } catch (emailError) {
            console.error('Email Delivery Engine Failed:', emailError);
        }

        return { message: 'Subscription successful! Check your inbox.' };
    }

    async verifyCoupon(body) {
        const { code, email } = body;

        if (!code || !email) {
            throw new AppError('Coupon code and user email are both required.', 400);
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            throw new AppError('Invalid coupon code.', 404);
        }

        if (coupon.isUsed) {
            throw new AppError('This coupon code has already been claimed.', 400);
        }

        if (new Date() > coupon.expiresAt) {
            throw new AppError('This coupon has expired.', 400);
        }

        if (coupon.associatedEmail !== email.toLowerCase().trim()) {
            throw new AppError('This coupon is exclusively linked to another account.', 403);
        }

        return {
            message: 'Coupon code applied cleanly!',
            discountPercentage: coupon.discountPercentage
        };
    }
}

module.exports = new CouponService();
