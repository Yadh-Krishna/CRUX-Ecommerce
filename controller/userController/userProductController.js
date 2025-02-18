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

const productList=async(req,res)=>{

    try {
        const user = req.user;
        let { gender, brand, category, sort, page } = req.query;

        let filter = { isDeleted: false };

        // Convert to array if it's a single value
        if (typeof gender === "string") gender = [gender];
        if (typeof brand === "string") brand = [brand];
        if (typeof category === "string") category = [category];

        // Apply Filters
        if (gender && gender.length > 0) filter.gender = { $in: gender };
        if (brand && brand.length > 0) filter.brands = { $in: brand };
        if (category && category.length > 0) filter.category = { $in: category };

        // Sorting Logic
        let sortOption = {};
        switch (sort) {
            case "priceLowToHigh":
                sortOption.finalPrice = 1;
                break;
            case "priceHighToLow":
                sortOption.finalPrice = -1;
                break;
            case "discountHighToLow":
                sortOption.discount = -1;
                break;
            case "discountLowToHigh":
                sortOption.discount = 1;
                break;
        }

        // Pagination Logic
        const limit = 6; // Number of products per page
        const currentPage = parseInt(page) || 1;
        const skip = (currentPage - 1) * limit;

        // Fetch Total Products Count
        const totalProducts = await Product.countDocuments(filter);

        // Fetch Products with Pagination
        const products = await Product.find(filter)
            .populate("category")
            .populate("brands")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // Fetch Brands & Categories
        const brands = await Brand.find();
        const categories = await Category.find();

        // Calculate Total Pages
        const totalPages = Math.ceil(totalProducts / limit);

        // Construct Query String for Pagination Links
        const queryParams = Object.entries(req.query)
            .filter(([key]) => key !== "page") // Remove "page" from query params
            .map(([key, value]) => `${key}=${value}`)
            .join("&");

        res.render("product-list", {
            products,
            brands,
            categories,
            gender,
            selectedBrands: brand || [],
            selectedCategories: category || [],
            sort,
            user,
            currentPage,
            totalPages,
            queryParams
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
      
}

module.exports={
    productDetails,
    loadHome,
    productList
}