exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            msg: 'This area is restricted to administrators only! Regular customers cannot register items.'
        });
    }
};