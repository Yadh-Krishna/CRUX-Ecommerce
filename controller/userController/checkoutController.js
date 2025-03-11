const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
require("dotenv").config();
const razorpay=require('razorpay');


const Address=require('../../models/addressModal')
const sendOTP =require('../../utils/sendOTP'); 
const Product=require('../../models/productModel')
const Cart=require('../../models/cartModel');
const Order= require('../../models/orderModal');
const { v4: uuidv4 } = require('uuid');


const loadCheckout=async(req,res)=>{
    try {        
        const userId = req.user.userId;
        const user=await User.findById(userId);
        if(!user){
            req.flash('error','User not found');
            return res.redirect('/login');
        }
        // Fetch cart details
        let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
        // Fetch user addresses
        const addresses = await Address.find({ user: userId });
    
        if (!cart || cart.items.length === 0) {
          return res.render('checkout', { addresses, user,cart: { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 }});
        }
    
        // Calculate cart totals
        let subtotal = 0;
        cart.items.forEach(item => {
          const finalPrice = item.product.price * (1 - item.product.discount / 100);
          subtotal += finalPrice * item.quantity;
          item.product.price = finalPrice.toFixed(2);
        });
    
        const taxRate = 0.1; // 10% tax rate
        const tax = subtotal * taxRate;
        const shipping = subtotal > 500 ? 0 : 50; // Free shipping over $100
        const total = subtotal + tax + shipping;
    
        res.render('checkout', {
          addresses,
          user,
          cart: {
            items: cart.items,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2)
          }
        });
      } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Internal Server Error');
      }
}

const loadOrder= async(req,res)=>{
    try{
        const userId=req.user.userId;
        const user=await User.findById(userId);
        if(!user){
            req.flash('error','User not found');
            res.redirect('/');
        }
        res.render('order-complete',{user});
        req.flash('success','Order placed Successfully');
    }catch(err){
        console.error(err);
        req.flash('error','Something Went Wrong');
    }
}


const placeOrder = async (req, res) => {
    try {
        const { userId, addressId, paymentMethod } = req.body;
        
        if (!userId || !addressId || !paymentMethod) {
            return res.status(400).json({ error: "Missing required details" });
        }
        
        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Your cart is empty" });
        }
        
        // Check inventory and product status
        for (const x of cart.items) {
            if (x.quantity > x.product.stock)
                return res.status(400).json({ error: `Not enough Stock for ${x.product.name}` });
            if (x.product.isDeleted)
                return res.status(400).json({ error: `Order cannot be placed ${x.product.name} is Blocked` });
        }
        
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ error: "Invalid address" });
        }
        
        // Calculate amounts
        let subtotal = cart.items.reduce((acc, item) => acc + item.product.finalPrice * item.quantity, 0);
        let tax = subtotal * 0.1;
        let shippingCharge = subtotal > 500 ? 0 : 50;
        let totalAmount = subtotal + tax + shippingCharge;
        
        // Create order object with common properties
        let newOrder = new Order({
            orderId: uuidv4(),
            user: userId,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                finalPrice: item.product.finalPrice
            })),
            subtotal,
            tax,
            shippingCharge,
            totalAmount,
            paymentMethod,
            paymentStatus: "Pending", // Initially set as pending for both methods
            orderStatus: "Pending",
            address: addressId,
            expectedDelivery: new Date(new Date().setDate(new Date().getDate() + 7)) // Estimated 7 days delivery
        });
        
        // Handle payment method-specific logic
        if (paymentMethod === "Online") {
            try {
                // Create Razorpay order
                const options = {
                    amount: Math.round(totalAmount * 100), // amount in smallest currency unit (paise)
                    currency: "INR",
                    receipt: `receipt_${Date.now()}`
                };
                
                const razorpayOrder = await razorpay.orders.create(options);
                
                // Add Razorpay-specific details to the order
                newOrder.razorpayOrderId = razorpayOrder.id;
                
                // Save order to database
                await newOrder.save();
                
                // Update inventory and clear cart
                for (let item of cart.items) {
                    await Product.findByIdAndUpdate(item.product._id, {
                        $inc: { stock: -item.quantity }
                    });
                }
                
                await Cart.findOneAndDelete({ user: userId });
                
                // Return Razorpay order details for client-side payment processing
                return res.json({
                    success: true,
                    message: "Razorpay order created successfully!",
                    order: newOrder,
                    razorpayOrder: razorpayOrder
                });
            } catch (error) {
                console.error("Razorpay order creation error:", error);
                return res.status(500).json({ error: "Failed to create Razorpay order" });
            }
        } else if (paymentMethod === "COD") {
            // For Cash on Delivery, mark payment status as Pending
            newOrder.paymentStatus = "Pending";
            
            // Save order to database
            await newOrder.save();
            
            // Update inventory and clear cart
            for (let item of cart.items) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: -item.quantity }
                });
            }
            
            await Cart.findOneAndDelete({ user: userId });
            
            // Return order details
            return res.json({
                success: true,
                message: "Order placed successfully!",
                order: newOrder
            });
        } else {
            return res.status(400).json({ error: "Invalid payment method" });
        }
    } catch (error) {
        console.error("Order error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const createRazorPay= async (req, res) => {
    try {
      const { userId, addressId, amount } = req.body;
      
      // Create Razorpay order
      const options = {
        amount: amount * 100, // amount in smallest currency unit (paise for INR)
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      };
      
      const order = await razorpay.orders.create(options);
      
      // Save order details to database
      const newOrder = new Order({
        userId,
        totalAmount: amount,
        addressId,
        paymentStatus:'Pending',
        paymentMethod: 'Online',
        orderId: order.id,
        products: req.body.products // Assuming products are passed in the request
      });
      
      await newOrder.save();
      
      return res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create order"
      });
    }
  }

  const verifyOnlinePayment=async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      // Verify signature
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_SECRET_KEY);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest('hex');
      
      if (generatedSignature === razorpay_signature) {
        // Payment is verified, update order status
        await Order.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { 
            paymentId: razorpay_payment_id,
            paymentStatus: 'Paid',
            orderStatus: 'Processing'
          }
        );
        
        return res.status(200).json({
          success: true,
          message: "Payment verified successfully"
        });
      } else {
        await Order.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { paymentStatus: 'Failed' }
        );
        
        return res.status(400).json({
          success: false,
          error: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to verify payment"
      });
    }
  }

    module.exports={
        loadCheckout,
        placeOrder,
        loadOrder,
        createRazorPay,
        verifyOnlinePayment
    }