const express = require('express');
const router = express.Router();
const multer = require('multer');
const passport = require('passport');
const { storage } = require('../config/cloudinary');

const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validationMiddleware');
const {
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
} = require('../validation/authValidation');

const {
    registerUser,
    loginUser,
    getUsers,
    toggleUserStatus,
    updateUserProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getUserProfile,
    verifyOtp,
    socialLoginSuccess,
    updateUserRole,
    getAdminContact
} = require('../controllers/authController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ storage });
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    validate(socialLoginSuccessSchema),
    socialLoginSuccess
);

router.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
    validate(socialLoginSuccessSchema),
    socialLoginSuccess
);
router.get('/profile', protect, validate(getUserProfileSchema), getUserProfile);
router.put('/profile', protect, upload.single('image'), validate(updateProfileSchema), updateUserProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.get('/', protect, adminOnly, validate(getUsersSchema), getUsers);
router.put('/:id/block', protect, adminOnly, validate(toggleUserStatusSchema), toggleUserStatus);
router.put('/:id/role', protect, adminOnly, validate(updateUserRoleSchema), updateUserRole);
router.get('/admin/contact', protect, validate(getAdminContactSchema), getAdminContact);

module.exports = router;
