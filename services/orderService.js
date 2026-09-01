const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const AppError = require('../utils/appError');

class OrderService {
    async addOrderItems(userId, userEmail, body, file) {
        const { orderItems, shippingAddress, totalPrice, couponCode } = body;

        if (!file) {
            throw new AppError("Please upload your payment receipt screenshot", 400);
        }

        const parsedItems = typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
        const parsedAddress = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;

        if (!parsedItems || parsedItems.length === 0) {
            throw new AppError("No ordered items found", 400);
        }

        for (const item of parsedItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new AppError(`Product not found: ${item.name}`, 404);
            }
            if (product.countInStock < item.qty) {
                throw new AppError(`Sorry, ${item.name} does not have enough stock remaining (Available: ${product.countInStock})`, 400);
            }
        }

        let finalTotalPrice = Number(totalPrice);
        let discountAmount = 0;
        let verifiedCouponCode = null;

        if (couponCode && couponCode.trim() !== '') {
            const cleanCode = couponCode.toUpperCase().trim();

            const historicalUsageCheck = await Order.findOne({
                user: userId,
                couponApplied: cleanCode
            });

            if (historicalUsageCheck) {
                throw new AppError("You have already used this coupon code on a previous order.", 400);
            }

            const coupon = await Coupon.findOne({
                code: cleanCode,
                associatedEmail: userEmail.toLowerCase(),
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });

            if (coupon) {
                if (coupon.discountPercentage === 100) {
                    discountAmount = finalTotalPrice;
                } else {
                    discountAmount = coupon.discountPercentage;
                }
                finalTotalPrice = Math.max(0, finalTotalPrice - discountAmount);
                verifiedCouponCode = coupon.code;

                coupon.isUsed = true;
                await coupon.save();
            } else {
                throw new AppError("The applied coupon code is invalid or has expired.", 400);
            }
        }

        const order = new Order({
            user: userId,
            orderItems: parsedItems.map(item => ({
                name: item.name,
                qty: item.qty,
                image: item.image,
                price: item.price,
                product: item.product,
                size: item.size || 'One Size',
                color: item.color || 'Default'
            })),
            shippingAddress: parsedAddress,
            couponApplied: verifiedCouponCode,
            discountAmount: discountAmount,
            totalPrice: finalTotalPrice,
            paymentScreenshot: file.path,
            status: 'Pending Verification'
        });

        const createdOrder = await order.save();
        return createdOrder;
    }

    async updateOrderToPaid(orderId) {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError("Order not found", 404);
        if (order.isPaid) throw new AppError("This order has already been paid", 400);

        order.isPaid = true;
        order.paidAt = Date.now();
        order.status = 'Processing';

        const updateStockPromises = order.orderItems.map(async (item) => {
            return await Product.findByIdAndUpdate(
                item.product,
                { $inc: { countInStock: -item.qty } }
            );
        });

        await Promise.all(updateStockPromises);
        const updatedOrder = await order.save();
        return updatedOrder;
    }

    async updateOrderToShipped(orderId, body) {
        const { shippedAt, expectedDeliveryStart, expectedDeliveryEnd } = body;
        const order = await Order.findById(orderId);
        if (!order) throw new AppError("Order not found", 404);

        order.status = 'In Transit';
        order.isShipped = true;
        order.shippedAt = shippedAt ? new Date(shippedAt) : new Date();

        if (expectedDeliveryStart) order.expectedDeliveryStart = new Date(expectedDeliveryStart);
        if (expectedDeliveryEnd) order.expectedDeliveryEnd = new Date(expectedDeliveryEnd);

        const updatedOrder = await order.save();
        return updatedOrder;
    }

    async updateOrderToDelivered(orderId) {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError("Order not found", 404);

        order.status = 'Delivered';
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        return updatedOrder;
    }

    async getOrders() {
        return await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    }

    async getOrderById(orderId) {
        const order = await Order.findById(orderId).populate('user', 'name email');
        if (!order) throw new AppError("Order not found", 404);
        return order;
    }

    async getMyOrders(userId) {
        return await Order.find({ user: userId }).sort({ createdAt: -1 });
    }

    async updateOrderToDeliveredByClient(orderId, userId) {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError("Order not found", 404);

        if (order.user.toString() !== userId.toString()) {
            throw new AppError("Not authorized", 403);
        }

        if (order.status !== 'In Transit') {
            throw new AppError("Order cannot be marked as delivered yet", 400);
        }

        order.status = 'Delivered';
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        return updatedOrder;
    }

    async validateCoupon(code, userId, userEmail) {
        if (!code) throw new AppError('Please provide a coupon code', 400);

        const cleanCode = code.trim().toUpperCase();

        const alreadyUsedInPastOrder = await Order.findOne({
            user: userId,
            couponApplied: cleanCode
        });

        if (alreadyUsedInPastOrder) {
            throw new AppError('You have already used this coupon code on a previous order. Limit 1 use per account.', 400);
        }

        const coupon = await Coupon.findOne({ code: cleanCode });
        if (!coupon) throw new AppError('Invalid coupon code', 404);

        if (coupon.associatedEmail.toLowerCase() !== userEmail.toLowerCase()) {
            throw new AppError('This coupon code is not registered to your account', 403);
        }

        if (coupon.isUsed) throw new AppError('This coupon has already been used', 400);

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            throw new AppError('This coupon has expired', 400);
        }

        return {
            code: coupon.code,
            discountPercentage: coupon.discountPercentage
        };
    }
}

module.exports = new OrderService();
