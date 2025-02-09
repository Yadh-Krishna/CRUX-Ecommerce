const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  image:{type:String,default: "/logo/default_user.avif"},
  createdDate: { type: Date, default: Date.now }, 
  updatedDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('users', userSchema);