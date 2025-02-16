const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");

const Product = require('../../models/productModel');
const Review=require('../../models/reviewModel')
const productDetails = async (req, res) => {
    // try {
    //     const id = req.params.id;

    //       // Fetch product with lean() for better performance
    //     const product = await Product.findById(id).lean();

    //     // Check if product exists and is not deleted
    //     if (!product || product.isDeleted) {
    //         return res.status(404).render('products', { product: null, message: "Product not found or is currently inactive",reviews:null });
    //     }

    //     res.render('products', { product ,message:null});    
    // } catch (err) {
    //     console.error("Error fetching product:", err);
    //     res.status(500).render('products', { product: null, message: "Internal Server Error" });
    // }
   
        try {
            const user=req.user;
            console.log("User: ",user);
            const product = await Product.findById(req.params.id)
                .populate("category")
                .populate("brands");
    
            if (!product || product.isDeleted) {
                return res.render("products", { message: "Product not found or unavailable.", product: null, reviews: [], user: null });
            }
    
            // Fetch reviews
            const reviews = await Review.find({ product: req.params.id }).populate("user", "fullName").sort({ createdAt: -1 });
    
            res.render("products", { product, reviews, user ,message:null });
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).render("products", { message: "Server error.", product: null, reviews: [], user: null});
        }
    };


module.exports={
    productDetails
}