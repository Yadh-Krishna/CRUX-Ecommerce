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
            const user = req.user;
            const slug = req.params.id; 
    
            // Find the product by slug only
            const product = await Product.findOne({ slug })
                .populate("category")
                .populate("brands");
    
            // If product not found or marked as deleted
            if (!product || product.isDeleted) {
                return res.render("products", { 
                    message: "Product not found or unavailable.", 
                    product: null, 
                    reviews: [], 
                    user: null, 
                    brand: null, 
                    relatedProducts: null 
                });
            }
    
            // Check if the product's category or brand is blocked
            if ((product.category && product.category.isBlocked) || 
                (product.brands && product.brands.isBlocked)) {
                return res.render("products", { 
                    message: "This product is currently unavailable.", 
                    product: null, 
                    reviews: [], 
                    user: null, 
                    brand: null, 
                    relatedProducts: null,                    
                });
            }
    
            // Fetch related products (excluding blocked category/brand)
            const relatedProducts = await Product.find({
                category: product.category._id, // Same category                
                isDeleted: false, // Exclude deleted products
                slug:{$ne:slug}
            });         
    
            // Fetch product reviews
            const reviews = await Review.find({ product: product._id })
                .populate("user", "fullName")
                .sort({ createdAt: -1 });
           
            res.render("products", { 
                product, 
                reviews, 
                user, 
                message: null, 
                brand: product.brands, 
                relatedProducts,
                breadcrumbs: [                    
                    { name: "Shop", url: "/product-list" },
                    { name: slug.toUpperCase(), url: `/product-list/${slug}`}]
            });
    
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).render("products", { 
                message: "Server error.", 
                product: null, 
                reviews: [], 
                user: null, 
                brand: null, 
                relatedProducts: null 
            });
        }
        
    };

const loadHome=async(req,res)=>{

    try {                         
        const user = req.user;

        // 1️⃣ Get valid categories and brands (not blocked or deleted)
        const validCategories = await Category.find({ isDeleted: false }).select("_id");
        const validBrands = await Brand.find({ isDeleted: false }).select("_id image name");

        const validCategoryIds = validCategories.map(cat => cat._id);
        const validBrandIds = validBrands.map(brand => brand._id);
        console.log(validBrandIds)

        // 2️⃣ Get only products with valid category & brand
        const products = await Product.find({
            isDeleted: false,
            category: { $in: validCategoryIds },
            brands: { $in: validBrandIds }
        });

        // 3️⃣ Render the home page
        res.render('homePage', { 
            products, 
            brands: validBrands, 
            category: validCategories, 
            user 
        });

    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(statusCodes.SERVER_ERROR).send(errorMessages.SERVER.SERVER_ERROR);
    }
        
    }

const productList=async(req,res)=>{    
    try {

        const user = req.user;
        let { search, gender, brand, category, sort, page } = req.query;
        let query = { isDeleted: false }; // Exclude deleted products

        const validCategories = await Category.find({ isDeleted: false }).select("_id");
        const validBrands = await Brand.find({ isDeleted: false}).select("_id");

        const validCategoryIds = validCategories.map(cat => cat._id.toString());
        const validBrandIds = validBrands.map(brand => brand._id.toString());

        query.category = { $in: validCategoryIds };
        query.brands = { $in: validBrandIds };

        // Search by name or description (case-insensitive)
        if (search) {
            query.name = { $regex: search, $options: "i" };               
        
        }

        // Filter by gender
        if (gender) {
            query.gender = Array.isArray(gender) ? { $in: gender } : [gender];
        }

        // Filter by brand
        if (brand) {
            const selectedBrands = Array.isArray(brand) ? brand : [brand];  
            query.brands =  { $in: selectedBrands.filter(b => validBrandIds.includes(b)) }; 
        }

        // Filter by category
        if (category) {
            const selectedCategories = Array.isArray(category) ? category : [category]; 
            query.category =     { $in: selectedCategories.filter(c => validCategoryIds.includes(c)) };
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

       
        const brands = await Brand.find({isDeleted:false}, "name image _id");
        const categories = await Category.find({isDeleted:false}, "name _id");

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
            sort,
            breadcrumbs: [{ name: "Shop", url: "/product-list" }]
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