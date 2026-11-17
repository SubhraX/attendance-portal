const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect, instructorOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for MEMORY storage (Bypasses Render's file deletion)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max size
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only image files are allowed!'));
    }
  }
});

// Upload Profile Image (Saves as Base64 to MongoDB)
router.post('/student/:id/image', protect, instructorOnly, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Convert the file buffer to a Base64 Data URL
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Store the giant string directly in the database
    student.profileImage = dataURI;
    await student.save();

    res.status(200).json({ 
      message: 'Profile image updated', 
      profileImage: student.profileImage 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error uploading image', error: error.message });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, stream, section } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role, stream, section });
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

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role,
        profileImage: user.profileImage // Included for immediate frontend display
      } 
    });
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
    const { name, email, password, stream, section, profileImage } = req.body;
    const student = await User.findById(req.params.id);
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    if (name) student.name = name;
    if (email) student.email = email;
    if (stream) student.stream = stream;
    if (section) student.section = section;
    
    // Support URL-based image updates without multipart form data
    if (profileImage !== undefined) student.profileImage = profileImage;
    
    if (password && password.trim().length > 0) {
      student.password = password.trim(); 
    }
    
    await student.save();
    res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists in the system.' });
    }
    res.status(500).json({ message: 'Server error updating student', error: error.message });
  }
});

// GET a single student's fresh profile data
router.get('/student/:id', protect, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password'); 
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;