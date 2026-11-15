const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, instructorOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, stream } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role, stream });
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.role === 'student') {
      if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).json({ message: 'Account is securely locked to another device.' });
      }
      if (!user.deviceId && deviceId) {
        await User.updateOne({ _id: user._id }, { $set: { deviceId: deviceId } });
      }
    }

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

// Logout User & Unlock Device
router.post('/logout', protect, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $set: { deviceId: null } });
    res.status(200).json({ message: 'Logged out successfully and device unlocked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
});

// Reset Student Device ID (Faculty Only)
router.post('/reset-device', protect, instructorOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: 'Student ID is required' });

    await User.updateOne({ _id: studentId }, { $set: { deviceId: null } });
    res.status(200).json({ message: 'Device lock removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all Students (Faculty Only)
router.get('/students', protect, instructorOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching students', error: error.message });
  }
});

// Remove a Student (Faculty Only)
router.delete('/student/:id', protect, instructorOnly, async (req, res) => {
  try {
    const studentId = req.params.id;
    await User.findByIdAndDelete(studentId);
    
    const Attendance = require('../models/Attendance');
    await Attendance.deleteMany({ student: studentId });
    
    res.status(200).json({ message: 'Student and their attendance records removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing student', error: error.message });
  }
});

// Edit a Student (Faculty Only)
router.put('/student/:id', protect, instructorOnly, async (req, res) => {
  try {
    const { name, email, password, stream } = req.body;
    const student = await User.findById(req.params.id);
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    if (name) student.name = name;
    if (email) student.email = email;
    if (stream) student.stream = stream;
    
    // FIX: Guarantee that only genuine new strings overwrite the password
    if (password && password.trim().length > 0) {
      student.password = password.trim(); 
    }
    
    await student.save();
    res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    // FIX: Gracefully catch MongoDB duplicate key errors if you accidentally assign an existing email
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists in the system.' });
    }
    res.status(500).json({ message: 'Server error updating student', error: error.message });
  }
});

module.exports = router;