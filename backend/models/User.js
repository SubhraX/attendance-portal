const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor'], default: 'student' },
  // Used to prevent a student from logging in on multiple devices to proxy attendance
  deviceId: { type: String, default: null }, 
  stream: { type: String, default: 'Unassigned' }
}, { timestamps: true });

// Hash password before saving
// FIX: Removed the 'next' parameter completely. Async Mongoose hooks automatically 
// proceed when the promise resolves. Mixing them causes a fatal 500 crash.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);