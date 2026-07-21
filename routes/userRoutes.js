const express = require('express');
const router = express.Router();
const multer = require('multer');
const passport = require('passport'); // Required for Social Login
const { storage } = require('../config/cloudinary'); 

// Import Rate Limiters from Middleware
const { authLimiter } = require('../middleware/rateLimiter');

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

// ==========================================
// --- PUBLIC ROUTES (Rate Limited Auth) ---
// ==========================================
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);

// ==========================================
// --- SOCIAL AUTH ROUTES (Browser Only) ---
// ==========================================

// Google Auth
router.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }), 
    socialLoginSuccess
);

// Facebook Auth
router.get('/auth/facebook', 
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), 
    socialLoginSuccess
);

// ==========================================
// --- PRIVATE ROUTES (LOGGED-IN USERS) ---
// ==========================================
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('image'), updateUserProfile);
router.put('/change-password', protect, changePassword);

// ==========================================
// --- ADMIN ROUTES ---
// ==========================================
router.get('/', protect, adminOnly, getUsers);
router.put('/:id/block', protect, adminOnly, toggleUserStatus);
router.put('/:id/role', protect, adminOnly, updateUserRole); 
router.get('/admin/contact', protect, getAdminContact); 

module.exports = router;