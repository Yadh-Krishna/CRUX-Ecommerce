const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require("../../utils/statusCodes");
const errorMessages=require('../../utils/errorMessages')

const Category=require('../../models/categoryModal')
const Brand=require('../../models/brandModel')
const Product = require('../../models/productModel');
const Review=require('../../models/reviewModel')
const productDetails = async (req, res) => {  
   
        try {
            const user=req.user;
            const product = await Product.findById(req.params.id)
                .populate("category")
                .populate("brands");
            
    
            if (!product || product.isDeleted) {
                return res.render("products", { message: "Product not found or unavailable.", product: null, reviews: [], user: null });
            }
                //related products
            const relatedProducts= await Product.find({category:product.category}).limit(5);
            // Fetch reviews
            const reviews = await Review.find({ product: req.params.id }).populate("user", "fullName").sort({ createdAt: -1 });
    
            res.render("products", { product, reviews, user ,message:null,brand:product.brands,relatedProducts });
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).render("products", { message: "Server error.", product: null, reviews: [], user: null,brand:null,relatedProducts:null});
        }
    };

const loadHome=async(req,res)=>{
        try {                         
            const isDeleted = false;
            const products = await Product.find({ isDeleted });
            const brands = await Brand.find({ isDeleted });
            const category = await Category.find({ isDeleted });
            console.log(req.user);
            // Check if either products or brands exist before rendering
            if (products.length > 0 || brands.length > 0 || category.length > 0) {
                res.render('homePage', { products, brands,category, user:req.user});
            } else {
                res.render('homePage', { products: [], brands: [] ,category:[], user:req.user.fullName}); // Render with empty arrays
            }
        } catch (error) {
            console.error("Error loading home page:", error);
            res.status(statusCodes.SERVER_ERROR).send("Internal Server Error");
        }
    }

module.exports={
    productDetails,
    loadHome
}