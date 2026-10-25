const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionToken: { type: String }, // Can be null for absences
  ipAddress: { type: String },
  status: { type: String, enum: ['present', 'absent'], default: 'present' } // NEW
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);