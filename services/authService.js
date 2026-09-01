const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const AppError = require('../utils/appError');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '6h' });
};

class AuthService {
    async register(body) {
        const { name, email, password, phone, address } = body;

        const userExists = await User.findOne({ email });
        if (userExists) throw new AppError('Email already exists', 400);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name, email, password: hashedPassword, phone, address,
            isActive: true
        });

        return {
            token: generateToken(user._id, user.role),
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        };
    }

    async login(body) {
        const { email, password } = body;
        const user = await User.findOne({ email });
        if (!user) throw new AppError('Invalid email or password', 400);

        if (!user.isActive) throw new AppError("Your account has been blocked! Please contact the administrator.", 403);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new AppError('Invalid email or password', 400);

        return {
            token: generateToken(user._id, user.role),
            user: {
                id: user._id, name: user.name, email: user.email,
                phone: user.phone, role: user.role, profilePicture: user.profilePicture
            }
        };
    }

    async socialLogin(reqUser) {
        if (!reqUser) throw new AppError("Social login failed", 400);
        const token = generateToken(reqUser._id, reqUser.role);
        return {
            id: reqUser._id,
            name: reqUser.name,
            email: reqUser.email,
            role: reqUser.role,
            profilePicture: reqUser.profilePicture,
            token
        };
    }

    async updateProfile(userId, body, file) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        user.name = body.name || user.name;
        user.email = (body.email || user.email).toLowerCase();
        user.phone = body.phone || user.phone;
        user.address = body.address || user.address;

        if (body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(body.password, salt);
        }

        if (file) {
            user.profilePicture = file.path;
        }

        const updatedUser = await user.save();

        return {
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
        };
    }

    async getProfile(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) throw new AppError('User not found', 404);
        return user;
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) throw new AppError("The old password is incorrect", 400);

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        return true;
    }

    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) throw new AppError("Email not found!", 404);

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
        return true;
    }

    async verifyOtp(email, otp) {
        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpire: { $gt: Date.now() },
        });
        if (!user) throw new AppError("Invalid or expired code.", 400);
        return true;
    }

    async resetPassword(email, otp, password) {
        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpire: { $gt: Date.now() },
        });

        if (!user) throw new AppError("Invalid or expired OTP!", 400);

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetOTP = undefined;
        user.resetOTPExpire = undefined;
        await user.save();
        return true;
    }

    async getUsers(queryRole) {
        const customerCount = await User.countDocuments({ role: 'customer' });
        const committeeCount = await User.countDocuments({ role: 'committee' });
        const filter = queryRole ? { role: queryRole } : {};
        const users = await User.find(filter).select('-password');
        return { users, customerCount, committeeCount };
    }

    async toggleUserStatus(targetId, currentUserId) {
        const userToChange = await User.findById(targetId);
        const currentUser = await User.findById(currentUserId);

        if (!userToChange) throw new AppError("User not found", 404);
        if (currentUserId === targetId) throw new AppError("You cannot block yourself!", 400);
        if (userToChange.isSuperAdmin) throw new AppError("The main administrator (Super Admin) cannot be blocked!", 403);
        if (userToChange.role === 'admin' && !currentUser.isSuperAdmin) {
            throw new AppError("Super Admin permission is required to block an administrator!", 403);
        }

        userToChange.isActive = !userToChange.isActive;
        await userToChange.save();
        return userToChange;
    }

    async updateUserRole(targetId, currentUserId, newRole) {
        const targetUser = await User.findById(targetId);
        const adminPerformingAction = await User.findById(currentUserId);

        if (!targetUser) throw new AppError("User not found", 404);
        if (!adminPerformingAction.isSuperAdmin) {
            throw new AppError("You do not have permission to appoint an admin! Super Admin authorization is required.", 403);
        }
        if (currentUserId === targetId) throw new AppError("You cannot demote your own Super Admin status here!", 400);
        if (targetUser.isSuperAdmin && currentUserId !== targetUser.id) {
            throw new AppError("The main administrator cannot be modified!", 403);
        }

        targetUser.role = newRole || 'admin';
        await targetUser.save();
        return targetUser;
    }

    async getAdminContact() {
        const admin = await User.findOne({
            $or: [{ role: 'admin' }, { isSuperAdmin: true }]
        }).select('phone email address');

        if (!admin) throw new AppError('Store contact information not found', 404);
        return {
            phone: admin.phone || 'No phone provided',
            email: admin.email || 'No email provided',
            address: admin.address || 'Addis Ababa, Ethiopia',
            hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
            closed: 'Sunday: Closed'
        };
    }
}

module.exports = new AuthService();
