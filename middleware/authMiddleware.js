const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');

      // SMART CHECK: If user is blocked, stop them here
      if (user && user.isActive === false) {
        return res.status(401).json({ message: 'Your account has been blocked!' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token is invalid' });
    }
  }
  if (!token) return res.status(401).json({ message: 'You are not logged in!' });
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};