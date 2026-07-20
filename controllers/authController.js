const nodemailer = require('nodemailer');
const User = require('../models/Users'); // Ensure this matches your filename
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Helper: Generate Token ---
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '6h' });
};

// 1. REGISTER
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

// 2. LOGIN
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });
        
        if (!user.isActive) return res.status(403).json({ message: "Your account has been blocked! Please contact the administrator." });

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
        
        res.json({
            success: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                profilePicture: updatedUser.profilePicture,
                role: updatedUser.role,
                isSuperAdmin: updatedUser.isSuperAdmin, 
                address: updatedUser.address
            },
            token: generateToken(updatedUser._id, updatedUser.role)
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. GET USER PROFILE
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin, 
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
        if (!isMatch) return res.status(400).json({ message: "The old password is incorrect" });

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
        if (!user) return res.status(404).json({ message: "Email not found!" });

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
                    <h2>Password Reset Code</h2>
                    <p>You can use this code to reset your password.</p>
                    <h1 style="color:orange; letter-spacing:5px;">${otp}</h1>
                    <p style="color:red;">This code is valid for 10 minutes only.</p>
                   </div>`,
        });

        res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to send email: " + error.message });
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

        if (!user) return res.status(400).json({ message: "Invalid or expired OTP!" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        user.resetOTP = undefined;
        user.resetOTPExpire = undefined;
        await user.save();

        res.json({ success: true, message: "Your password has been changed successfully!" });
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
        const currentUser = await User.findById(req.user.id);

        if (!userToChange) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. RULE: You cannot block yourself
        if (req.user.id === req.params.id) {
            return res.status(400).json({ 
                success: false, 
                message: "You cannot block yourself!" 
            });
        }

        // 2. RULE: You cannot block the Super Admin (Creator)
        if (userToChange.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "The main administrator (Super Admin) cannot be blocked!" 
            });
        }

        // 3. RULE: A regular Admin cannot block another Admin
        if (userToChange.role === 'admin' && !currentUser.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "Super Admin permission is required to block an administrator!" 
            });
        }

        // If all checks pass, toggle status
        userToChange.isActive = !userToChange.isActive;
        await userToChange.save();

        res.json({ 
            success: true, 
            message: `The user has been ${userToChange.isActive ? 'unblocked' : 'blocked'}`, 
            user: userToChange 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 9. UPDATE USER ROLE (Admin Only - e.g., Make Admin)
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body; 
        const targetUser = await User.findById(req.params.id);
        const adminPerformingAction = await User.findById(req.user.id);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. CRITICAL GUARD: Only a Super Admin can change roles
        if (!adminPerformingAction.isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "You do not have permission to appoint an admin! Super Admin authorization is required. (Only Super Admin can change roles)" 
            });
        }

        // 2. Prevent Super Admin from accidentally de-ranking themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({ 
                success: false, 
                message: "You cannot demote your own Super Admin status here!" 
            });
        }

        // 3. Prevent changing the role of another Super Admin
        if (targetUser.isSuperAdmin && req.user.id !== targetUser.id) {
            return res.status(403).json({ 
                success: false, 
                message: "The main administrator cannot be modified!" 
            });
        }

        // Apply the new role
        targetUser.role = role || 'admin';
        await targetUser.save();

        res.json({ 
            success: true, 
            message: `User role has been changed to ${targetUser.role}! ✅`, 
            user: targetUser 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET ADMIN CONTACT INFO (Public)
const getAdminContact = async (req, res) => {
    try {
        const admin = await User.findOne({
            $or: [{ role: 'admin' }, { isSuperAdmin: true }]
        }).select('phone email address');

        if (!admin) {
            return res.status(404).json({ message: 'Store contact information not found' });
        }

        res.status(200).json({
            phone: admin.phone || 'No phone provided',
            email: admin.email || 'No email provided',
            address: admin.address || 'Addis Ababa, Ethiopia',
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
    socialLoginSuccess, 
    updateUserRole,
    getAdminContact 
};