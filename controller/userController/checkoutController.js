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


const loadCheckout=async(req,res)=>{
    try {
        const userId = req.user.userId;
        const user=await User.findById(userId);
        if(!user){
            req.flash('error','User not found');
            return res.redirect('/login');
        }
        // Fetch cart details
        let cart = await Cart.findOne({ user: userId }).populate({'items.product'});
    
        // Fetch user addresses
        const addresses = await Address.find({ user: userId });
    
        if (!cart || cart.items.length === 0) {
          return res.render('checkout', { addresses, user,cart: { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 } });
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
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
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

module.exports={
    loadCheckout
}