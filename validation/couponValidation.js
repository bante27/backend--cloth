const { z } = require('zod');

const subscribeSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "Email is required" }).email("Invalid email format")
    })
});

const verifyCouponSchema = z.object({
    body: z.object({
        code: z.string({ required_error: "Coupon code is required" }),
        email: z.string({ required_error: "Email is required" }).email("Invalid email format")
    })
});

const checkStatusSchema = z.object({});

module.exports = {
    subscribeSchema,
    verifyCouponSchema,
    checkStatusSchema
};
