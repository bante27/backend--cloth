const Joi = require('joi');

const registerSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        phone: Joi.string().optional(),
        address: Joi.string().optional()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const loginSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const socialLoginSuccessSchema = Joi.object({
    body: Joi.object().optional(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const updateProfileSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().optional(),
        address: Joi.string().optional(),
        password: Joi.string().min(6).optional()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const getUserProfileSchema = Joi.object({
    body: Joi.object().optional(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const changePasswordSchema = Joi.object({
    body: Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const forgotPasswordSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const verifyOtpSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const resetPasswordSchema = Joi.object({
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required(),
        password: Joi.string().min(6).required()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

const getUsersSchema = Joi.object({
    body: Joi.object().optional(),
    query: Joi.object({
        role: Joi.string().valid('customer', 'admin', 'committee').optional()
    }).optional(),
    params: Joi.object().optional()
});

const toggleUserStatusSchema = Joi.object({
    body: Joi.object().optional(),
    query: Joi.object().optional(),
    params: Joi.object({
        id: Joi.string().required()
    }).required()
});

const updateUserRoleSchema = Joi.object({
    body: Joi.object({
        role: Joi.string().valid('customer', 'admin', 'committee').required()
    }).required(),
    query: Joi.object().optional(),
    params: Joi.object({
        id: Joi.string().required()
    }).required()
});

const getAdminContactSchema = Joi.object({
    body: Joi.object().optional(),
    query: Joi.object().optional(),
    params: Joi.object().optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    socialLoginSuccessSchema,
    updateProfileSchema,
    getUserProfileSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    getUsersSchema,
    toggleUserStatusSchema,
    updateUserRoleSchema,
    getAdminContactSchema
};
