const express = require('express');
const router = express.Router();
const multer = require('multer');
const passport = require('passport'); // Required for Social Login
const { storage } = require('../config/cloudinary'); 
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
    socialLoginSuccess, // This is the new helper we added to the controller
    updateUserRole ,// This is the new helper we added to the controller
    getAdminContact // New route for fetching admin contact info

} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ storage });

// ==========================================
// --- PUBLIC ROUTES ---
// ==========================================
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

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
router.put('/:id/role', protect, adminOnly, updateUserRole); // New route for updating user role
router.get('/admin/contact', protect, getAdminContact); // New route for fetching admin contact info
module.exports = router;