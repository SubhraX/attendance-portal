const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user and issue JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // DEVICE LOCK LOGIC (Only enforced on students)
    if (user.role === 'student') {
      if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).json({ message: 'Account is securely locked to another device.' });
      }
      // Lock the account to this device on their very first successful login
      if (!user.deviceId && deviceId) {
        user.deviceId = deviceId;
        await user.save();
      }
    }

    // Generate JWT token valid for 1 year (365 days)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '365d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;