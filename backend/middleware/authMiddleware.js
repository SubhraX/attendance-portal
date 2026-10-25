const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      // Prevent 500 crash if the user was deleted but token is still active
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
      }

      return next(); // CRITICAL: Must return to stop execution
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const instructorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    return next(); // CRITICAL: Must return
  } else {
    return res.status(403).json({ message: 'Not authorized as an instructor' });
  }
};

module.exports = { protect, instructorOnly };