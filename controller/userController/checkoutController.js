const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
require("dotenv").config();

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


const placeOrder= async (req, res) => {
    try {
        const { userId, addressId, paymentMethod } = req.body;

        if (!userId || !addressId || !paymentMethod) {
            return res.status(400).json({ error: "Missing required details" });
        }

        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Your cart is empty" });   
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({ error: "Invalid address" });
        }

        let subtotal = cart.items.reduce((acc, item) => acc + item.product.finalPrice * item.quantity, 0);
        let tax = subtotal * 0.1;  // Assuming 5% tax
        let shippingCharge = subtotal > 500 ? 0 : 50; // Free shipping for orders above ₹500
        let totalAmount = subtotal + tax + shippingCharge;

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
            paymentStatus: paymentMethod === "COD" ? "Pending" : "Completed",
            orderStatus: "Pending",
            address: addressId,
            expectedDelivery: new Date(new Date().setDate(new Date().getDate() + 7)) // Estimated 7 days delivery
        });

        await newOrder.save();

        for (let item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock: -item.quantity } // Reduce stock count
            });
        }

        await Cart.findOneAndDelete({ user: userId }); // Clear cart after placing order

        res.json({ success: true, message: "Order placed successfully!", order: newOrder });

        } catch (error) {
        console.error("Order error:", error);
        res.status(500).json({ error: "Internal Server Error" });
        }
    }



    module.exports={
        loadCheckout,
        placeOrder,
        loadOrder
    }