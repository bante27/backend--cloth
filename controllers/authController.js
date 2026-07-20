const nodemailer = require('nodemailer');
const User = require('../models/Users'); // Ensure this matches your filename
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Helper: Generate Token ---
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '6h' });
};

// 1. REGISTER (ተጠቃሚ መመዝገቢያ)
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name, email, password: hashedPassword, phone, address,
            isActive: true
        });

        res.status(201).json({ 
            success: true,
            token: generateToken(user._id, user.role),
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. LOGIN (መግቢያ)
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });
        
        if (!user.isActive) return res.status(403).json({ message: "አካውንትዎ ታግዷል! እባክዎ አስተዳዳሪውን ያነጋግሩ።" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        res.json({ 
            success: true,
            token: generateToken(user._id, user.role), 
            user: { 
                id: user._id, name: user.name, email: user.email,
                phone: user.phone, role: user.role, profilePicture: user.profilePicture 
            } 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- SOCIAL LOGIN SUCCESS (Google/Facebook Redirect) ---
const socialLoginSuccess = async (req, res) => {
    try {
        if (!req.user) return res.status(400).json({ message: "Social login failed" });

        const token = generateToken(req.user._id, req.user.role);

        const userData = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            // 💡 ከ Google/Facebook የመጣውን ፎቶ እዚህ እንጨምራለን
            profilePicture: req.user.profilePicture, 
            token: token
        };

        const userString = encodeURIComponent(JSON.stringify(userData));
        res.redirect(`${process.env.FRONTEND_URL}/login-success?user=${userString}`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. UPDATE PROFILE
// 3. UPDATE PROFILE (Fixed with Cloudinary error handling)
// 3. UPDATE PROFILE (Keeping your logic, but adding isSuperAdmin to response)
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = (req.body.email || user.email).toLowerCase();
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        if (req.file) {
            user.profilePicture = req.file.path;
        }

        const updatedUser = await user.save();
        
        // Final Response matches what Frontend AdminProfile expects
        res.json({
            success: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                profilePicture: updatedUser.profilePicture,
                role: updatedUser.role,
                isSuperAdmin: updatedUser.isSuperAdmin, // 🔥 Required for Admin Dashboard
                address: updatedUser.address
            },
            token: generateToken(updatedUser._id, updatedUser.role)
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. GET USER PROFILE (FIXED)
const getUserProfile = async (req, res) => {
    try {
        // .select('-password') is good for security
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // IMPORTANT: Wrap the user in a 'user' object and include 'success: true'
        // This stops the infinite loading spinner on the frontend.
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin, // 🔥 Ensures the Admin Badge shows up
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 5. CHANGE PASSWORD (Logged-in)
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "የድሮው የይለፍ ቃል የተሳሳተ ነው" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        res.json({ success: true, message: "Password updated successfully! ✅" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. FORGOT PASSWORD - OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "ኢሜሉ አልተገኘም!" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetOTP = otp;
        user.resetOTPExpire = Date.now() + 10 * 60 * 1000; 
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD },
        });

        await transporter.sendMail({
            from: `"Habesha Cloths" <${process.env.MAIL_USERNAME}>`,
            to: email,
            subject: 'Password Reset OTP',
            html: `<div style="font-family:sans-serif; text-align:center; padding:20px; border:1px solid #eee;">
                    <h2>የይለፍ ቃል መቀየሪያ ኮድ</h2>
                    <p>ይህንን ኮድ ተጠቅመው የይለፍ ቃልዎን መቀየር ይችላሉ።</p>
                    <h1 style="color:orange; letter-spacing:5px;">${otp}</h1>
                    <p style="color:red;">ይህ ኮድ ለ 10 ደቂቃ ብቻ ያገለግላል።</p>
                   </div>`,
        });

        res.json({ success: true, message: "OTP ተልኳል!" });
    } catch (error) {
        res.status(500).json({ message: "Email መላክ አልተቻለም፡ " + error.message });
    }
};

// 7. VERIFY OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired code." });
        }

        res.json({ success: true, message: "OTP verified" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 8. RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpire: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: "የተሳሳተ ወይም ጊዜው ያለፈበት OTP!" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        user.resetOTP = undefined;
        user.resetOTPExpire = undefined;
        await user.save();

        res.json({ success: true, message: "ፓስወርድዎ በትክክል ተቀይሯል!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- ADMIN FUNCTIONS ---
const getUsers = async (req, res) => {
    const customerCount = await User.countDocuments({ role: 'customer' });
    const committeeCount = await User.countDocuments({ role: 'committee' });
    
    const role = req.query.role;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');

    res.json({ users, customerCount, committeeCount });
};

const toggleUserStatus = async (req, res) => {
    try {
        const userToChange = await User.findById(req.params.id);
        // This is the admin currently logged in (from your protect middleware)
        const currentUser = await User.findById(req.user.id);

        if (!userToChange) {
            return res.status(404).json({ message: "ተጠቃሚው አልተገኘም (User not found)" });
        }

        // 1. RULE: You cannot block yourself
        if (req.user.id === req.params.id) {
            return res.status(400).json({ 
                success: false, 
                message: "ራስዎን ማገድ አይችሉም!" 
            });
        }

        // 2. RULE: You cannot block the Super Admin (Creator)
        if (userToChange.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "ዋናውን አስተዳዳሪ (Super Admin) ማገድ አይቻልም!" 
            });
        }

        // 3. RULE: A regular Admin cannot block another Admin
        // Only a Super Admin has the power to block other Admins
        if (userToChange.role === 'admin' && !currentUser.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "አስተዳዳሪን ለማገድ የሱፐር አድሚን ፈቃድ ያስፈልጋል!" 
            });
        }

        // If all checks pass, toggle status
        userToChange.isActive = !userToChange.isActive;
        await userToChange.save();

        res.json({ 
            success: true, 
            message: `ተጠቃሚው ${userToChange.isActive ? 'ተለቋል' : 'ታግዷል'}`, 
            user: userToChange 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// --- ADMIN FUNCTIONS ---

// 9. UPDATE USER ROLE (Admin Only - e.g., Make Admin)
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body; // 'admin' or 'customer'
        const targetUser = await User.findById(req.params.id);
        const adminPerformingAction = await User.findById(req.user.id);

        if (!targetUser) {
            return res.status(404).json({ message: "ተጠቃሚው አልተገኘም (User not found)" });
        }

        // 1. CRITICAL GUARD: Only a Super Admin can change roles
        if (!adminPerformingAction.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "አድሚን የመሾም ስልጣን የለዎትም! የሱፐር አድሚን ፈቃድ ያስፈልጋል። (Only Super Admin can change roles)" 
            });
        }

        // 2. Prevent Super Admin from accidentally de-ranking themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({ 
                success: false, 
                message: "የራስዎን የሱፐር አድሚን ስልጣን እዚህ መቀነስ አይችሉም!" 
            });
        }

        // 3. Prevent changing the role of another Super Admin (if you have multiple)
        if (targetUser.isSuperAdmin && req.user.id !== targetUser.id) {
            return res.status(403).json({ 
                success: false, 
                message: "ዋናውን አስተዳዳሪ መቀየር አይቻልም!" 
            });
        }

        // Apply the new role
        targetUser.role = role || 'admin';
        await targetUser.save();

        res.json({ 
            success: true, 
            message: `የተጠቃሚው ሚና ወደ ${targetUser.role} ተቀይሯል! ✅`, 
            user: targetUser 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// controllers/authController.js (or wherever you handle settings)

// ==========================================
// GET ADMIN CONTACT INFO (Public)
// ==========================================
const getAdminContact = async (req, res) => {
    try {
        // 1. Fetch the admin from the database
        // We select only the fields necessary for the contact card
        const admin = await User.findOne({
            $or: [{ role: 'admin' }, { isSuperAdmin: true }]
        }).select('phone email address');

        // 2. Error handling if no user exists in the DB
        if (!admin) {
            return res.status(404).json({ message: 'Store contact information not found' });
        }

        // 3. Send back the real data
        // We provide "logical" fallbacks in case the admin hasn't filled their profile yet
        res.status(200).json({
            phone: admin.phone || 'No phone provided',
            email: admin.email || 'No email provided',
            address: admin.address || 'Addis Ababa, Ethiopia',
            // These stay as strings for now unless you add them to your DB Schema
            hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
            closed: 'Sunday: Closed'
        });

    } catch (error) {
        console.error('Admin contact fetch error:', error);
        res.status(500).json({ message: 'Server error fetching contact data' });
    }
};
// --- EXPORTS ---
module.exports = { 
    registerUser, 
    loginUser, 
    getUsers, 
    toggleUserStatus, 
    updateUserProfile, 
    getUserProfile,
    changePassword,
    forgotPassword,
    verifyOtp,
    resetPassword,
    socialLoginSuccess, // Added for Passport
    updateUserRole,
    getAdminContact // New export for fetching admin contact info
};