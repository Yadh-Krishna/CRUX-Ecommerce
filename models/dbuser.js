const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  otpExpires: { type: Date },
  image:{type:String,default: "/logo/default_user.avif"},
  googleId: { type: String },
}, { timestamps: true });


module.exports = mongoose.model('users', userSchema);