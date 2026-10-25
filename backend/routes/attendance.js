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
    instructorIP: req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress 
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

  // Same Wi-Fi Verification using Render's proxy headers
  if (lockedCampusIP) {
    const studentRawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const studentIP = studentRawIP.split(',')[0].trim();
    
    if (studentIP !== lockedCampusIP && studentIP !== '::1' && studentIP !== '127.0.0.1') {
      return res.status(403).json({ message: 'Access Denied: You must be connected to the campus Wi-Fi to mark attendance.' });
    }
  }

  try {
    const alreadyMarked = await Attendance.findOne({ student: req.user._id, sessionToken: scannedToken });
    if (alreadyMarked) return res.status(400).json({ message: 'Attendance already marked' });

    const record = await Attendance.create({
      student: req.user._id,
      sessionToken: scannedToken,
      ipAddress: req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress
    });

    res.status(200).json({ message: 'Attendance marked successfully', record });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;