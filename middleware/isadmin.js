exports.adminOnly = (req, res, next) => {
    // req.user comes from the preceding 'protect' middleware
    if (req.user && req.user.role === 'admin') {
        next(); // If admin, proceed to the item registration handler
    } else {
        return res.status(403).json({ 
            success: false, 
            msg: 'This area is restricted to administrators only! Regular customers cannot register items.' 
        });
    }
};