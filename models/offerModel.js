const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
offerType: { type: String, enum: ['product', 'category'], required: true }, // Defines if offer is for Product or Category
discountValue: { type: Number, required: true }, // Discount amount (percentage or fixed)  
isActive: { type: Boolean, default: true }, // Offer Status
prod: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Applied Products
cat: [{ type: mongoose.Schema.Types.ObjectId, ref: 'category' }], // Applied Categories
}, { timestamps: true });


module.exports = mongoose.model('Offer', OfferSchema);