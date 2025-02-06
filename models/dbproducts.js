const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brands: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    createdOn: { type: Date, default: Date.now },
    updatedOn: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Product', ProductSchema);