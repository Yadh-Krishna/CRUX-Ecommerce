const mongoose=require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    items: [{ 
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    orderStatus: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    createdDate: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Order', OrderSchema);