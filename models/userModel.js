const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: function() { return !this.googleId; } },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: function() { return !this.googleId; } },
  password: { type: String, required: function() { return !this.googleId;}},
  isActive: { type: Boolean, default: true },
  dateOfBirth: {
    type: Date,
    required: false  // Optional field, can be updated later
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false  // Optional field, can be updated later
  },
  otp: { type: String },
  googleId: { type: String, unique: true, sparse: true }, // Allow users without Google OAuth
  isVerified: { type: Boolean, default: false },
  otpExpires: { type: Date },
  image:{type:String,default: "/logo/default_user.avif"},
}, { timestamps: true });


module.exports = mongoose.model('users', userSchema);