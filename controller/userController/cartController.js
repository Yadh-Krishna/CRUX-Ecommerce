const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages');
const crypto = require("crypto");
require("dotenv").config();

const sendOTP =require('../../utils/sendOTP'); 
const Product=require('../../models/productModel')
const Cart=require('../../models/cartModel');

const loadCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        let subtotal = 0;
        let discount = 0;

        if (!cart || cart.items.length === 0) {
            return res.render("cart", { 
                user, 
                cartItems: [], 
                subtotal: 0,
                discount: 0,
                grandTotal: 0,
                relatedProducts: [] 
            });
        }

        let cartItems = [];

        cartItems = cart.items.map((item) => {
            if (!item.product) {
                console.error(`Product not found for cart item: ${item._id}`);
                return null; // Skip this item if the product is missing
            }

            const product = item.product; 
            const price = product.discount
                ? product.price - (product.price * product.discount) / 100
                : product.price;
            const total = price * item.quantity;
            subtotal += total;

            return {
                id: product._id,
                name: product.name,
                image: product.images?.[0] || "", // Avoid accessing undefined image array
                price: price,
                quantity: item.quantity,
                total: total,
            };
        }).filter(item => item !== null); // Remove null items

        let grandTotal = subtotal - discount;

        // Ensure at least one product exists in the cart before querying related products
        let relatedProducts = [];
        if (cart.items[0]?.product?.category) {
            relatedProducts = await Product.find({ 
                category: cart.items[0].product.category,
                _id: { $ne: cart.items[0].product._id } 
            }).limit(4);
        }

        res.render("cart", {
            cartItems,
            subtotal,
            relatedProducts,
            discount,
            grandTotal,
            user,
        });
    } catch (error) {
        console.error("Error loading cart:", error);
        res.status(500).send("Server Error");
    }
};


const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.userId; // Ensure user is authenticated

        if (!productId || !quantity) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        //  Check if product exists
        const product = await Product.findById(productId);
        if (!product || product.stock === 0) {
            return res.status(400).json({ success: false, message: "Product is out of stock" });
        }

        //  Check if user already has a cart
        let cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            // If no cart exists, create a new one
            cart = new Cart({ user: userId, items: [] });
        }

        //  Check if product is already in cart
        const existingItem = cart.items.find(item => item.product.id.toString() === productId);

        if (existingItem) {
            // If product already exists, update quantity (but don't exceed stock)
            if (existingItem.quantity + quantity > product.stock) {
                return res.status(400).json({ success: false, message: "Not enough stock available" });
            }
            if(existingItem.quantity + quantity > 10){
                return res.status(400).json({ success: false, message: "Only 10 quantities can be added per product" });
            }
            existingItem.quantity += quantity;
        } else {
            // Otherwise, add new product to cart
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        return res.status(200).json({ success: true, message: "Product added to cart" });

    } catch (error) {
        console.error("Add to Cart Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const updateCart = async (req, res) => {
    try {
        const { quantity, productId } = req.body;
        const userId = req.user.userId;

        const user=await User.findById(userId);
        if(!user){
            return res.redirect('/login');
        }

        // Fetch product to check stock availability
        const product = await Product.findById(productId);
        if (!product || product.isDeleted) {
            return res.status(400).json({ success: false, message: "Product not found or inactive" });
        }

        // Fetch user's cart and populate product details
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found" });
        }

        // Find the cart item by productId
        const item = cart.items.find(i => i.product._id.toString() === productId);
        if (!item) {
            return res.status(400).json({ success: false, message: "Product not found in cart" });
        }
        
        // Check stock availability
        if (quantity > item.product.stock) {
            item.quantity = item.product.stock; // Set quantity to available stock
            await cart.save();
            
            return res.json({ 
                success: false, 
                message: "Quantity adjusted to available stock",
                adjustedQuantity: item.product.stock  // Send updated quantity to frontend
            });
        }
        
        // Update quantity and save
        item.quantity = quantity;
        await cart.save();
        
        return res.json({ success: true, message: "Quantity updated successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

const removeProduct= async(req,res)=>{
    try{
        const productId=req.params.id;
        const userId=req.user.userId;
        const cart=await Cart.findOne({user:userId}).populate('items.product');
        if(!cart){
            return res.status(400).json({success:false,message:"Cart not found"});
            }
            const item=cart.items.find(i=>i.product._id.toString()==productId);
            if(!item){
                return res.status(400).json({success:false,message:"Product not found in cart"});
            }
            cart.items.pull(item);
            await cart.save();
            return res.json({success:true,message:"Product removed successfully"});
            }catch(err){
                console.error(err);
                return res.status(500).json({success:false,message:"Something went wrong"});
                }             
}

module.exports={
    loadCart,
    addToCart,
    updateCart,
    removeProduct
}