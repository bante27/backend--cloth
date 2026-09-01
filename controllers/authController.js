const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

const registerUser = catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
});

const loginUser = catchAsync(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
});

const socialLoginSuccess = catchAsync(async (req, res) => {
    const userData = await authService.socialLogin(req.user);
    const userString = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`${process.env.FRONTEND_URL}/login-success?user=${userString}`);
});

const updateUserProfile = catchAsync(async (req, res) => {
    const result = await authService.updateProfile(req.user.id, req.body, req.file);
    res.json({ success: true, ...result });
});

const getUserProfile = catchAsync(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
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
});

const changePassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully! ✅" });
});

const forgotPassword = catchAsync(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: "OTP sent successfully!" });
});

const verifyOtp = catchAsync(async (req, res) => {
    const { email, otp } = req.body;
    await authService.verifyOtp(email, otp);
    res.json({ success: true, message: "OTP verified" });
});

const resetPassword = catchAsync(async (req, res) => {
    const { email, otp, password } = req.body;
    await authService.resetPassword(email, otp, password);
    res.json({ success: true, message: "Your password has been changed successfully!" });
});

const getUsers = catchAsync(async (req, res) => {
    const data = await authService.getUsers(req.query.role);
    res.json(data);
});

const toggleUserStatus = catchAsync(async (req, res) => {
    const user = await authService.toggleUserStatus(req.params.id, req.user.id);
    res.json({
        success: true,
        message: `The user has been ${user.isActive ? 'unblocked' : 'blocked'}`,
        user
    });
});

const updateUserRole = catchAsync(async (req, res) => {
    const targetUser = await authService.updateUserRole(req.params.id, req.user.id, req.body.role);
    res.json({
        success: true,
        message: `User role has been changed to ${targetUser.role}! ✅`,
        user: targetUser
    });
});

const getAdminContact = catchAsync(async (req, res) => {
    const contact = await authService.getAdminContact();
    res.status(200).json(contact);
});

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
