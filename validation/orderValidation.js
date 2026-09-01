const { z } = require('zod');

const addOrderItemsSchema = z.object({
    body: z.object({
        orderItems: z.any({ required_error: "Order items are required" }),
        shippingAddress: z.any({ required_error: "Shipping address is required" }),
        totalPrice: z.any({ required_error: "Total price is required" }),
        couponCode: z.string().optional()
    })
});

const updateOrderToPaidSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Order ID parameter is required" })
    })
});

const updateOrderToShippedSchema = z.object({
    body: z.object({
        shippedAt: z.string().optional(),
        expectedDeliveryStart: z.string().optional(),
        expectedDeliveryEnd: z.string().optional()
    }).optional(),
    params: z.object({
        id: z.string({ required_error: "Order ID parameter is required" })
    })
});

const updateOrderToDeliveredSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Order ID parameter is required" })
    })
});

const getOrdersSchema = z.object({});

const getOrderByIdSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Order ID parameter is required" })
    })
});

const getMyOrdersSchema = z.object({});

const updateOrderToDeliveredByClientSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Order ID parameter is required" })
    })
});

const validateCouponSchema = z.object({
    body: z.object({
        code: z.string({ required_error: "Coupon code is required" })
    })
});

module.exports = {
    addOrderItemsSchema,
    updateOrderToPaidSchema,
    updateOrderToShippedSchema,
    updateOrderToDeliveredSchema,
    getOrdersSchema,
    getOrderByIdSchema,
    getMyOrdersSchema,
    updateOrderToDeliveredByClientSchema,
    validateCouponSchema
};
