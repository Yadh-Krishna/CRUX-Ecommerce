const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
const Coupon=require('../../models/couponModel')
require("dotenv").config();
const razorpay=require('../../config/razorPay');
const mongoose=require('mongoose');
const he=require('he')


const Address=require('../../models/addressModal')
const sendOTP =require('../../utils/sendOTP'); 
const Product=require('../../models/productModel')
const Cart=require('../../models/cartModel');
const Order= require('../../models/orderModal');
const { v4: uuidv4 } = require('uuid');
const { STATUS_CODES } = require('http');
const generateOrderId = () => {
    const today = new Date();
    const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
    const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `CRUX-${datePart}-${randomPart}`;
  };

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
        const addresses = await Address.find({ user: userId ,isDeleted:false });
        
        if (!cart || cart.items.length === 0) {
          return res.render('checkout', { addresses, user,cart: { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 }});
        }       
   
        // Calculate cart totals
        let subtotal = 0;
        let appliedCoupon = cart.appliedCoupon || null ;   

        cart.items.forEach(item => {
          const finalPrice = item.product.finalPrice;
          subtotal += finalPrice * item.quantity;
        //   item.product.price = finalPrice;
        });


        const coupons=await Coupon.find({isActive:true,startDate:{$lte:new Date()},expireOn:{$gte:new Date()}});
        
        let couponOff = 0;
        
        if (appliedCoupon && mongoose.Types.ObjectId.isValid(appliedCoupon)) {
             let coupon = await Coupon.findById(appliedCoupon);

            if(!coupon.isActive){
                req.flash('error','Coupon is inactive');
                appliedCoupon = null;
                cart.appliedCoupon = null;
                await cart.save();
                    }

            if (coupon && subtotal >= coupon.minimumPrice) {
                couponOff = coupon.offerPrice; 
                appliedCoupon=coupon;
            } else {              
                appliedCoupon = null;
                cart.appliedCoupon = null;
                await cart.save();
            }
        }

       
        
        
        const taxRate = 0.1; // 10% tax rate
        const tax = subtotal * taxRate;
        const shipping = subtotal > 1000 ? 0 : 50; 
        const total = subtotal + tax + shipping - couponOff;        

        

        res.render('checkout', {
          addresses,
          availableCoupons:coupons,
          user,
          appliedCoupon: appliedCoupon ? appliedCoupon : null,
          couponOff,
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

const applyCoupon = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { couponId ,subtotal} = req.body ;

        if (!mongoose.Types.ObjectId.isValid(couponId)) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Invalid coupon ID" });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(statusCodes.NOT_FOUND).json({ success: false, message: "Cart not found" });
        }

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(statusCodes.NOT_FOUND).json({ success: false, message: "Coupon not found" });
        }

        if (subtotal < coupon.minimumPrice) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: `Coupon minimum purchase price is ₹${coupon.minimumPrice}` });
        }

        if (coupon.userId.includes(userId)) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: `Coupon is already used before` });
        }

       
        cart.appliedCoupon = coupon._id;    
        await cart.save();            

        return res.status(statusCodes.SUCCESS).json({ success: true, message: `Coupon applied successfully!` });

    } catch (err) {
        console.error(err);
        return res.status(statusCodes.SERVER_ERROR).json({ success: false, message: "Internal Server Error" });
    }
};

const removeCoupon=async(req,res)=>{
    try{   
        const userId=req.user.userId;
        const { couponId } = req.body

        if (!mongoose.Types.ObjectId.isValid(couponId)) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Invalid coupon ID" });
        }

        const cart=await Cart.findOne({user:userId});
        if (!cart) {
            return res.status(statusCodes.NOT_FOUND).json({ success: false, message: "Cart not found" });
        }
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(statusCodes.NOT_FOUND).json({ success: false, message: "Coupon not found" });
        }

          if (cart.appliedCoupon && cart.appliedCoupon.toString() === couponId) {
            cart.appliedCoupon = null;
            await cart.save();
            return res.status(statusCodes.SUCCESS).json({ success: true, message: "Coupon removed successfully!" });
        } else {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, message: "Coupon is not applied to the cart" });
        }

    }catch(err){
        console.error(err);
    }
}

const placeOrder = async (req, res) => {
    try {
        const { userId, addressId, paymentMethod, paymentId, orderId,appliedCoupon} = req.body;
        
        if (!userId || !addressId || !paymentMethod) {
            return res.status(400).json({ error: "Missing required details" });
        }
        
        
        // If this is completing a Razorpay order
        if (paymentMethod === "Online" && orderId) {           
            const order = await Order.findOne({ razorpayOrderId: orderId });
            
            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            
            return res.json({
                success: true,
                message: "Order placed successfully!",
                order: order
            });
        }        

        // For COD orders, process normally
        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Your cart is empty" });
        }
        
        // Check inventory and product status
        for (const item of cart.items) {
            if (item.quantity > item.product.stock)
                return res.status(400).json({ error: `Not enough Stock for ${item.product.name}` });
            if (item.product.isDeleted)
                return res.status(400).json({ error: `Order cannot be placed ${item.product.name} is Blocked` });
        }
        
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ error: "Invalid address" });
        }        

        const coupon=await Coupon.findById(appliedCoupon);
        if(!coupon){
            return res.status(400).json({ error: "Invalid Coupon " });
        }
        const couponOff=coupon.offerPrice;
        
        coupon.userId.push(userId);
        await coupon.save();
        
        // Calculate amounts
        let subtotal = cart.items.reduce((acc, item) => acc + item.product.finalPrice * item.quantity, 0);
        let tax = subtotal * 0.1;
        let shippingCharge = subtotal > 1000 ? 0 : 50;
        let totalAmount = subtotal + tax + shippingCharge-couponOff;
        
        // Create order object
        let newOrder = new Order({
            orderId: generateOrderId(),
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
            paymentMethod: "COD", // For COD orders
            paymentStatus: "Pending",
            orderStatus: "Pending",
            address: addressId,
            expectedDelivery: new Date(new Date().setDate(new Date().getDate() + 1)),         
            couponPrice:couponOff,
            couponApplied:true
        });
        
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
    } catch (error) {
        console.error("Order error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const createRazorPay = async (req, res) => {
    try {
        const { userId, addressId, amount, products, couponOff, shippingCharge, tax, subtotal } = req.body;
        
        if (!userId || !addressId || !amount) {
            return res.status(400).json({ error: "Missing required details" });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit (paise for INR)
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };
        
        const items = typeof products === 'string' ? JSON.parse(he.decode(products)): products;

        const coupon=await Coupon.findById(couponOff);
        let couponOfferPrice
        if(!coupon){
            couponOfferPrice=0;
        }else{
         couponOfferPrice=coupon.offerPrice;
        
        coupon.userId.push(userId);
        await coupon.save();
        }    

        const order = await razorpay.orders.create(options);
        // Create a temporary order in the database
        const newOrder = new Order({
            user: userId,
            orderId: generateOrderId(), 
            razorpayOrderId: order.id, // Store Razorpay order ID in a separate field for clarity
            address: addressId,
            totalAmount: amount,
            paymentStatus: 'Pending',
            paymentMethod: 'Online',
            orderStatus: 'Created',
            // Parse products if they came as a string
            items,
            tax,
            shippingCharge,
            subtotal,
            couponPrice: couponOfferPrice || null
        });
        
        await newOrder.save();
        
        return res.status(200).json({
            success: true,
            order: order,
            key_id: process.env.RAZOR_PAY_KEY_ID // Send key ID to the client
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create order"
        });
    }
};

const verifyOnlinePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing payment verification details" 
            });
        }
        
        // Verify signature
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_SECRET_KEY);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');
        
        if (generatedSignature === razorpay_signature) {
            // Payment is verified, update order status
            const updatedOrder = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { 
                    paymentId: razorpay_payment_id,
                    paymentStatus: 'Paid',
                    orderStatus: 'Processing',   
                    "items.$[].status": "Processing", //update staus of all items                 
                },
                { new: true }
            ).populate('items.product');


           
            
            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    error: "Order not found"
                });
            }
            
            // Clear the user's cart after successful payment
            await Cart.findOneAndDelete({ user: updatedOrder.user });
            
            // Update product stock levels
            for (const item of updatedOrder.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity }
                });
            }
            
            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                order: updatedOrder
            });
        } else {
            // Signature verification failed
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
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
};

const getOrderInfo = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        
        const order = await Order.findOne({ razorpayOrderId: orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: "Order not found"
            });
        }
        
        // Get order details from Razorpay
        const razorpayOrder = await razorpay.orders.fetch(orderId);
        
        return res.json({
            success: true,
            order: razorpayOrder,
            key_id: process.env.RAZOR_PAY_KEY_ID
        });
    } catch (error) {
        console.error("Error fetching order info:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch order information"
        });
    }
};

const cancelFailedOrder = async (req, res) => {
        try {
            const { orderId } = req.body;
            
            if (!orderId) {
                return res.status(400).json({ error: "Order ID is required" });
            }
            
            // Find and delete the order
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: orderId },
                { orderStatus: "Cancelled", paymentStatus: "Failed" },
                { new: true }
            );
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: "Order not found"
                });
            }
            
            return res.json({
                success: true,
                message: "Order cancelled successfully"
            });
        } catch (error) {
            console.error("Error cancelling order:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to cancel order"
            });
        }
    };





    module.exports={
        loadCheckout,
        placeOrder,
        loadOrder,
        applyCoupon,
        removeCoupon,
        createRazorPay,
        verifyOnlinePayment,
        getOrderInfo,
        cancelFailedOrder

    }