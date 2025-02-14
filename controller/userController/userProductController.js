const bcrypt=require('bcrypt');
const User=require('../../models/dbuser');
const jwt = require("jsonwebtoken");

const Product = require('../../models/dbproducts')
const productDetails = async (req, res) => {
    try {
        const id = req.params.id;

          // Fetch product with lean() for better performance
        const product = await Product.findById(id).lean();

        // Check if product exists and is not deleted
        if (!product || product.isDeleted) {
            return res.status(404).render('products', { product: null, message: "Product not found or is currently inactive" });
        }

        res.render('products', { product ,message:null});    
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).render('products', { product: null, message: "Internal Server Error" });
    }
};

module.exports={
    productDetails
}