const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sessionToken: { 
    type: String, 
    required: true 
  },
  ipAddress: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// This compound index makes the duplicate check instant
attendanceSchema.index({ student: 1, sessionToken: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);