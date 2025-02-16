const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, 
  finalPrice: { type: Number },  
  stock: { type: Number, required: true },
  images: [{ type: String, required: true }],  // Ensure at least 3 images
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
  brands: { type: mongoose.Schema.Types.ObjectId, ref: 'brand' }, 
  gender: { type: String, enum: ["Men", "Women", "Unisex"], required: true },
  ratings: { type: Number, default: 0 },
  tags: [{ type: String }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
  
  module.exports = mongoose.model('Product', ProductSchema);