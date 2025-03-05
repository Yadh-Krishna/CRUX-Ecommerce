const mongoose=require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // Unique Order ID
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who placed the order
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // Price at the time of purchase
      discount: { type: Number, default: 0 }, // Discount on the product
      finalPrice: { type: Number, required: true }, // Price after discount
      status: { 
        type: String, 
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned"], 
        default: "Pending" 
    }
    }
  ],
  totalAmount: { type: Number, required: true }, // Final order total
  paymentMethod: { type: String, enum: ["COD", "Online"], required: true }, // Payment mode
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Failed", "Refunded"], 
    default: "Pending" 
  }, // Payment status
  orderStatus: { 
    type: String, 
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request","Returned"], 
    default: "Pending" 
  }, // Order status
  address: { type: mongoose.Schema.Types.ObjectId, ref: "address", required: true }, // Shipping address
  deliveredAt: { type: Date }, // When the order was delivered
  cancellationReason: { type: String,default:null }, // Reason if order is cancelled
  returnReason: { type: String }, // Reason if order is returned
  refundStatus: { 
    type: String, 
    enum: ["Initiated", "Completed", "Not Applicable"], 
    default: "Not Applicable" 
  }, // Refund process status
  expectedDelivery: { type: Date },
  trackingId: { type: String, default: null }, // Tracking ID from courier service
  invoiceUrl: { type: String, default: null }, // Link to invoice PDF
  isDeleted: { type: Boolean, default: false } // Soft delete for orders
}, { timestamps: true });
  
  module.exports = mongoose.model('Order', OrderSchema);