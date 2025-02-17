const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const Product=require('../../models/productModel');
const Brand=require('../../models/brandModel');
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages');

require("dotenv").config();

const loadHome=async(req,res)=>{
    try {
        const loginUser=req.user;        
        const user= await User.find({loginUser});
        // console.log(user);
        const isDeleted = false;
        const products = await Product.find({ isDeleted });
        const brands = await Brand.find({ isDeleted });

        // Check if either products or brands exist before rendering
        if (products.length > 0 || brands.length > 0) {
            res.render('homePage', { products, brands });
        } else {
            res.render('homePage', { products: [], brands: [] }); // Render with empty arrays
        }
    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(statusCodes.SERVER_ERROR).send("Internal Server Error");
    }
}

module.exports={
    loadHome
}