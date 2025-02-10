const Product=require('../../models/dbproducts');
const Category=require('../../models/dbcategory');
const Brand=require('../../models/dbrands');  
const asyncHandler = require('express-async-handler');

const upload = require("../../middleware/upload");  //multer 
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');

const productList= asyncHandler(async (req, res) => {
    try {
      // Pagination & Filters
      let page = parseInt(req.query.page) || 1;
      let limit = 5; // Number of products per page
      let skip = (page - 1) * limit;
  
      let search = req.query.search || "";
      let category = req.query.category || "";
      let brand = req.query.brand || "";
      let status = req.query.status || "";
  
      // **Filter Query Object**
      let filter = {};
      
      if (search) {
        filter.name = { $regex: search, $options: "i" }; // Case-insensitive search
      }
      
      if (category) {
        filter.category = category;
      }
      
      if (brand) {
        filter.brands = brand;
      }
  
      if (status === "Active") {
        filter.isDeleted = false;
      } else if (status === "Disabled") {
        filter.isDeleted = true;
      }
  
      // Fetch data with pagination
      let products = await Product.find(filter)
        .populate("category brands")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
  
      // Count total products for pagination
      let totalProducts = await Product.countDocuments(filter);
      let totalPages = Math.ceil(totalProducts / limit);
  
      // Fetch categories & brands for dropdowns
      let categories = await Category.find();
      let brands = await Brand.find();
  
      res.render("product", {
        products,
        categories,
        brands,
        search,
        selectedCategory: category,
        selectedBrand: brand,
        status,
        currentPage: page,
        totalPages
      });
  
    } catch (error) {
      console.error("Error fetching products:", error);
      res.redirect("/admin/error");
    }
  });

const addProductLoad=asyncHandler(async(req,res)=>{
  try{
   const categories=await Category.find();
   const brands=await Brand.find();

    res.render('add-product',{categories,brands});
  }catch (error) {
    console.error("Error loading categories/brands:", error);
    req.flash("error", "Failed to load product form. Try again.");
    res.redirect("/admin/products");
  }
});

const addProduct=asyncHandler(async(req,res)=>{

  upload.array("images", 5)(req, res, async (err) => {
    if (err) {
      req.flash("error", err.message);
      console.log("Hi hello")
      return res.redirect("/admin/products/add");
    }

    // Extract data from the form
    const { name, description, price, discount, stock, category, brands, gender, tags } = req.body;
    console.log(req.body);
   
    // Ensure images are uploaded
    if (!req.files || req.files.length < 3) {
      req.flash("error", "Upload at least 3 images.");
      return res.redirect("/admin/products/add");
    }

    // Process images using Sharp
    const imagePaths = await Promise.all(
      req.files.map(async (file) => {
        const outputPath = `/uploads/products/${file.filename}`;

        const inputPath = path.join(__dirname, "..", "..", file.path);
      const output = path.join(outputDir, file.filename);

        console.log("Processing image:", inputPath, "→", outputPath); // Debugging

        await sharp(file.path)
          .resize(500, 500, { fit: "cover" })
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        return `/uploads/products/${file.filename}`;
      })
    );

    // Calculate final price
    const finalPrice = price - (price * (discount || 0)) / 100;

    // Create & Save Product
    await Product.create({
      name,
      description,
      price,
      discount: discount || 0,
      finalPrice,
      stock,
      category,
      brands,
      gender,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      images: imagePaths,
    });

    req.flash("success", "Product added successfully!");
    res.redirect("/admin/products");
  });
});
      

const editProduct=(req,res)=>{
    res.render('edit-product',{product:{tags:[],images:[]},categories:[],brands:[] });
}
module.exports={
    productList,
    addProductLoad,
    addProduct,
    editProduct
};

