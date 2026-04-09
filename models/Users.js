const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    role: { type: String, default: 'customer' }, // 'customer', 'admin'
    isActive: { type: Boolean, default: true },
    isSuperAdmin: { type: Boolean, default: false }, // 🔥 The "Boss" flag
    profilePicture: { 
        type: String, 
        default: 'https://res.cloudinary.com/djx6uzc3k/image/upload/v1711896363/default-avatar.png' 
    },
    resetOTP: { type: String }, 
    resetOTPExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);