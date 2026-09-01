const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
        password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
        phone: z.string().optional(),
        address: z.string().optional()
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
        password: z.string({ required_error: "Password is required" })
    })
});

const socialLoginSuccessSchema = z.object({});

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        password: z.string().min(6).optional()
    })
});

const getUserProfileSchema = z.object({});

const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string({ required_error: "Old password is required" }),
        newPassword: z.string({ required_error: "New password is required" }).min(6, "New password must be at least 6 characters")
    })
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "Email is required" }).email("Invalid email format")
    })
});

const verifyOtpSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
        otp: z.string({ required_error: "OTP is required" })
    })
});

const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
        otp: z.string({ required_error: "OTP is required" }),
        password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters")
    })
});

const getUsersSchema = z.object({
    query: z.object({
        role: z.enum(['customer', 'admin', 'committee']).optional()
    }).optional()
});

const toggleUserStatusSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "User ID parameter is required" })
    })
});

const updateUserRoleSchema = z.object({
    body: z.object({
        role: z.enum(['customer', 'admin', 'committee'], { required_error: "Role is required" })
    }),
    params: z.object({
        id: z.string({ required_error: "User ID parameter is required" })
    })
});

const getAdminContactSchema = z.object({});

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
