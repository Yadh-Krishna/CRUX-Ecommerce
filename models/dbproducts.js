const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, 
  finalPrice: { type: Number },  
  stock: { type: Number, required: true },
  images: [{ type: String, required: true }],  // Ensure at least 3 images
  thumbnail: { type: String },  
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brands: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'] },
  ratings: { type: Number, default: 0 },
  reviews: [
      { 
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
          comment: String, 
          rating: Number, 
          createdAt: { type: Date, default: Date.now }
      }
  ],
  tags: [{ type: String }],
  slug: { type: String, unique: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
  
  module.exports = mongoose.model('Product', ProductSchema);