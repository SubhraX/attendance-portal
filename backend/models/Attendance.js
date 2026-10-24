// backend/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionToken: { type: String, required: true }, // The ephemeral QR token scanned
  ipAddress: { type: String, required: true }, // Used to verify they are on the college Wi-Fi
  status: { type: String, enum: ['Present', 'Flagged'], default: 'Present' }
}, { timestamps: true });

// Ensure a student can only submit one attendance record per session token
attendanceSchema.index({ student: 1, sessionToken: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);