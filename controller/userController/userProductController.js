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

const productList=async(req,res)=>{

    try {
        const user = req.user;
        let { search, gender, brand, category, sort, page } = req.query;
        let query = { isDeleted: false }; // Exclude deleted products

        // Search by name or description (case-insensitive)
        if (search) {
            query = { name: { $regex: search, $options: "i" } };
               
        
        }

        // Filter by gender
        if (gender) {
            query.gender = Array.isArray(gender) ? { $in: gender } : [gender];
        }

        // Filter by brand
        if (brand) {
            query.brands = Array.isArray(brand) ? { $in: brand } : [brand];
        }

        // Filter by category
        if (category) {
            query.category = Array.isArray(category) ? { $in: category } : [category];
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // Default: Newest First
        if (sort === "priceLowToHigh") {
            sortOption = { finalPrice: 1 };
        } else if (sort === "priceHighToLow") {
            sortOption = { finalPrice: -1 };
        }

        // Pagination
        const pageSize = 8; 
        const currentPage = parseInt(page) || 1;
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / pageSize);

        // Fetch products
        const products = await Product.find(query)
            .sort(sortOption)
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .populate("category brands");

        // Fetch all brands and categories for the filter
        const brands = await Brand.find({}, "name image _id");
        const categories = await Category.find({}, "name _id");

        // Render updated product list
        res.render("product-list", { 
            products, 
            currentPage, 
            totalPages, 
            queryParams: req.query,
            user,
            selectedBrands: brand ? (Array.isArray(brand) ? brand : [brand]) : [],
            selectedCategories: category ? (Array.isArray(category) ? category : [category]) : [],
            brands, 
            categories,
            gender: gender ? (Array.isArray(gender) ? gender : [gender]) : [],
            sort
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Server Error");
    }  
      
}

module.exports={
    productDetails,
    loadHome,
    productList
}