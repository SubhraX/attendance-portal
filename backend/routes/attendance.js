const express = require('express');
const crypto = require('crypto');
const { protect, instructorOnly } = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');

const router = express.Router();
global.activeSessions = {}; 
let lockedCampusIP = null; // Stores the faculty's network IP

// Lock Network Route
router.post('/lock-network', protect, instructorOnly, (req, res) => {
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  lockedCampusIP = rawIP.split(',')[0].trim();
  res.json({ message: 'Network locked successfully', ip: lockedCampusIP });
});

// Unlock Network Route
router.post('/unlock-network', protect, instructorOnly, (req, res) => {
  lockedCampusIP = null;
  res.json({ message: 'Network unlocked. Attendance can now be marked from any IP.' });
});

// Start Session
router.post('/start', protect, instructorOnly, (req, res) => {
  const { classId, qrDuration } = req.body;
  if (!classId) return res.status(400).json({ message: 'classId is required' });

  // Use the custom duration sent from the frontend, or default to 30s
  const durationMs = (qrDuration || 30) * 1000;
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + durationMs; 

  global.activeSessions[classId] = { 
    currentToken: token, 
    expiresAt,
    instructorIP: req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress,
    markedStudents: new Set() // Memory tracker for the live session
  };

  res.status(200).json({ message: 'Session started', token, expiresAt });
});

// Mark Attendance (With Mercy Overwrite for Current Day)
router.post('/mark', protect, async (req, res) => {
  const { classId, scannedToken } = req.body;
  
  if (!classId || !scannedToken) {
    return res.status(400).json({ message: 'Missing classId or token' });
  }

  const session = global.activeSessions[classId];

  if (!session) {
    return res.status(400).json({ message: 'No active attendance session for this class' });
  }

  // Instantly block if they already scanned during this exact live session instance
  const studentIdStr = req.user._id.toString();
  if (session.markedStudents.has(studentIdStr)) {
    return res.status(400).json({ message: 'Attendance already marked for this session' });
  }

  if (scannedToken !== session.currentToken || Date.now() > session.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired QR code' });
  }

  // Same Wi-Fi Verification using Render's proxy headers
  if (lockedCampusIP) {
    const studentRawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const studentIP = studentRawIP.split(',')[0].trim();
    
    if (studentIP !== lockedCampusIP && studentIP !== '::1' && studentIP !== '127.0.0.1') {
      return res.status(403).json({ message: 'Access Denied: You must be connected to the campus Wi-Fi to mark attendance.' });
    }
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look for an existing record for TODAY
    let record = await Attendance.findOne({
      student: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const studentIP = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;

    if (record) {
      // Mercy Rule: Overwrite existing 'absent' or older record for today to 'present'
      record.sessionToken = scannedToken;
      record.status = 'present';
      record.ipAddress = studentIP;
      await record.save();
    } else {
      // Create new record
      record = await Attendance.create({
        student: req.user._id,
        sessionToken: scannedToken,
        status: 'present',
        ipAddress: studentIP
      });
    }

    // Add student to memory lock to instantly block subsequent scans in THIS session
    session.markedStudents.add(studentIdStr);

    // Broadcast to the faculty panel in real-time
    if (global.facultySockets && global.facultySockets[classId]) {
      global.facultySockets[classId].send(JSON.stringify({
        type: 'STUDENT_MARKED',
        student: {
          name: req.user.name, 
          email: req.user.email
        }
      }));
    }

    res.status(200).json({ message: 'Attendance marked successfully', record });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Attendance History (Faculty Only)
router.get('/history', protect, instructorOnly, async (req, res) => {
  try {
    const { date, classId } = req.query;
    let filter = {};

    // Optional date filtering (Expects format: YYYY-MM-DD)
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    // Fetch records, populate student profiles, and sort newest first
    const records = await Attendance.find(filter)
      .populate('student', 'name email deviceId')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      count: records.length, 
      records 
    });
  } catch (error) {
    console.error("History API Error:", error);
    res.status(500).json({ message: 'Server error fetching history', error: error.message });
  }
});

// Get specific student's attendance for the calendar (Faculty Only)
router.get('/student/:id', protect, instructorOnly, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching student attendance', error: error.message });
  }
});

// Stop Session and Mark Absentees (Prevents duplicate daily absentees)
router.post('/stop', protect, instructorOnly, async (req, res) => {
  const { classId } = req.body;
  const session = global.activeSessions[classId];

  if (!session) return res.status(400).json({ message: 'No active session found.' });

  try {
    const User = require('../models/User');
    const allStudents = await User.find({ role: 'student' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find who already has ANY record today (present or absent)
    const todayRecords = await Attendance.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const todayStudentIds = new Set(todayRecords.map(r => r.student.toString()));

    const absentRecords = [];
    
    allStudents.forEach(student => {
      // Only create an absent record if they didn't scan AND don't already have a record for today
      if (!session.markedStudents.has(student._id.toString()) && !todayStudentIds.has(student._id.toString())) {
        absentRecords.push({
          student: student._id,
          sessionToken: 'MISSED',
          status: 'absent'
        });
      }
    });

    if (absentRecords.length > 0) {
      await Attendance.insertMany(absentRecords);
    }

    delete global.activeSessions[classId];
    res.status(200).json({ message: 'Session stopped and absences recorded.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error stopping session', error: error.message });
  }
});

module.exports = router;