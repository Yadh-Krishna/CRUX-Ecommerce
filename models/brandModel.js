const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String, // Store image URL or file path
    default: "/logo/category-brand-default-img.jpg", // Default failover image
  },
  isDeleted: {
    type: Boolean,
    default: true, // Brands are active by default
  },
}, { timestamps: true });

module.exports = mongoose.model("brand", brandSchema);
