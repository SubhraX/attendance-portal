const express = require('express');
const crypto = require('crypto');
const { protect, instructorOnly } = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');

const router = express.Router();
global.activeSessions = {}; 

// Start Session
router.post('/start', protect, instructorOnly, (req, res) => {
  const { classId } = req.body;
  if (!classId) return res.status(400).json({ message: 'classId is required' });

  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 30 * 1000; 

  global.activeSessions[classId] = { 
    currentToken: token, 
    expiresAt,
    instructorIP: req.ip 
  };

  res.status(200).json({ message: 'Session started', token, expiresAt });
});

// Mark Attendance
router.post('/mark', protect, async (req, res) => {
  const { classId, scannedToken } = req.body;
  
  if (!classId || !scannedToken) {
    return res.status(400).json({ message: 'Missing classId or token' });
  }

  const session = global.activeSessions[classId];

  if (!session) {
    return res.status(400).json({ message: 'No active attendance session for this class' });
  }

  if (scannedToken !== session.currentToken || Date.now() > session.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired QR code' });
  }

  // Same Wi-Fi Verification
  const getSubnet = (ip) => ip.includes(':') ? ip.split(':').slice(0, -1).join(':') : ip.split('.').slice(0, 3).join('.');
  const instructorSubnet = getSubnet(session.instructorIP);
  const studentSubnet = getSubnet(req.ip);

  if (instructorSubnet !== studentSubnet && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    return res.status(403).json({ message: 'Access Denied: Must be on campus Wi-Fi.' });
  }

  try {
    const alreadyMarked = await Attendance.findOne({ student: req.user._id, sessionToken: scannedToken });
    if (alreadyMarked) return res.status(400).json({ message: 'Attendance already marked' });

    const record = await Attendance.create({
      student: req.user._id,
      sessionToken: scannedToken,
      ipAddress: req.ip
    });

    res.status(200).json({ message: 'Attendance marked successfully', record });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;