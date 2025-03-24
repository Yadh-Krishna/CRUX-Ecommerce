const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // Unique Order ID
  razorpayOrderId: { type: String }, // Razorpay order ID for online payments
  paymentId: { type: String }, // Payment ID from payment gateway
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }, // User who placed the order
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true ,default: 0}, // Price at the time of purchase
      discount: { type: Number, default: 0 }, // Discount on the product
      finalPrice: { type: Number, required: true,default: 0 }, // Price after discount
      status: { 
        type: String, 
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned"], 
        default: "Pending" 
      },
      cancellationReason: { type: String, default: null }, // Item-level cancellation reason
      returnReason: { type: String }, 
    }
  ],
  subtotal: { type: Number, required: true }, // Subtotal before tax and shipping
  tax: { type: Number, required: true }, // Tax amount
  shippingCharge: { type: Number, required: true }, // Shipping charges
  totalAmount: { type: Number, required: true }, // Final order total
  couponPrice:{ type: Number, default: 0},
  paymentMethod: { type: String, enum: ["COD", "Online"], required: true }, // Payment mode
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Failed", "Refunded", "Created"], 
    default: "Pending" 
  }, // Payment status
  orderStatus: { 
    type: String, 
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned", "Created"], 
    default: "Pending" 
  }, // Order status
  address: { type: mongoose.Schema.Types.ObjectId, ref: "address", required: true }, // Shipping address
  deliveredAt: { type: Date }, // When the order was delivered
  cancellationReason: { type: String, default: null }, // Reason if order is cancelled
  returnReason: { type: String }, // Reason if order is returned
  refundStatus: { 
    type: String, 
    enum: ["Initiated", "Completed", "Not Applicable"], 
    default: "Not Applicable" 
  }, // Refund process status
  expectedDelivery: { type: Date },
  trackingId: { type: String, default: null }, // Tracking ID from courier service
  invoiceUrl: { type: String, default: null }, // Link to invoice PDF
  couponApplied: { type: Boolean, default: false } // Soft delete for orders
}, { timestamps: true });


const generateOrderId = () => {
  const today = new Date();
  const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
  const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  return `CRUX-${datePart}-${randomPart}`;
};

  
module.exports = mongoose.model('Order', OrderSchema);