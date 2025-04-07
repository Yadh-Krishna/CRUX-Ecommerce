const Product=require('../../models/productModel');
const Category=require('../../models/categoryModal');
const Brand=require('../../models/brandModel');  
const asyncHandler = require('express-async-handler');
// const Offer=require('../../models/offerModel');

const upload = require("../../middleware/upload");  
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');
const statusCodes=require('../../utils/statusCodes')
const errorMessages=require('../../utils/errorMessages')


const productList = asyncHandler(async (req, res) => {
  try {
      let page = parseInt(req.query.page) || 1;
      let limit = 5; // Number of products per page
      let skip = (page - 1) * limit;

      let search = req.query.search || "";
      let category = req.query.category || "";
      let brand = req.query.brand || "";
      let status = req.query.status || "";

      let filter = {};

      if (search) {
          filter.name = { $regex: search, $options: "i" };
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

      // Fetch products and populate categories & brands
      let products = await Product.find(filter)
          .populate("category brands")
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });

     
      let totalProducts = await Product.countDocuments(filter);
      let totalPages = Math.ceil(totalProducts / limit);

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

// const liveSearchProducts = asyncHandler(async (req, res) => {
//     try {
//       let search = req.query.search || "";
//       let category = req.query.category || "";
//       let brand = req.query.brand || "";
//       let status = req.query.status || "";
  
//       let filter = {};
  
//       if (search) {
//         filter.name = { $regex: search, $options: "i" };
//       }
  
//       if (category) {
//         filter.category = category;
//       }
  
//       if (brand) {
//         filter.brands = brand;
//       }
  
//       if (status === "Active") {
//         filter.isDeleted = false;
//       } else if (status === "Disabled") {
//         filter.isDeleted = true;
//       }
  
//       let products = await Product.find(filter).populate("category brands").sort({ createdAt: -1 });
  
//       const formatDate = (date) => {
//         const d = new Date(date);
//         return d.toISOString().split("T")[0]; // Format as YYYY-MM-DD
//       };
  
//       let formattedProducts = products.map((product) => ({
//         _id: product._id,
//         name: product.name,
//         price: product.price,
//         finalPrice: product.finalPrice || product.price,
//         image: product.images.length ? product.images[0] : "/assets/imgs/default.jpg",
//         isDeleted: product.isDeleted,
//         formattedDate: formatDate(product.createdAt),
//         shortDescription: product.description.length > 50 ? product.description.substring(0, 50) + "..." : product.description,
//       }));
  
//       res.json({ products: formattedProducts });
//     } catch (error) {
//       console.error("Error in live search:", error);
//       res.status(500).json({ error: "Failed to fetch products" });
//     }
//   });

const addProductLoad=asyncHandler(async(req,res)=>{
  try{
    const isDeleted=false;
   const categories=await Category.find({isDeleted});
   const brands=await Brand.find({isDeleted});

    res.render('add-product',{categories,brands});
  }catch (error) {
    console.error("Error loading categories/brands:", error);
    req.flash("error", "Failed to load product form. Try again.");
    res.redirect("/admin/products");
  }
});

const addProduct= asyncHandler(async (req, res) => {
  try {
    // Extract form data
    const { name, description, price, discount, stock, category, brands, gender, tags } = req.body;

    // Validate images
    if (!req.files || req.files.length < 3) {
      req.flash("error", "Upload at least 3 images.");
      return res.redirect("/admin/products/add");
    }

    // Ensure output directory for processed images exists
    const outputDir = path.join(__dirname, "..", "..", "public/uploads/products");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process images using Sharp
    const imagePaths = await Promise.all(
      req.files.map(async (file) => {
        const inputPath = file.path; // Original uploaded file path
        const outputPath = path.join(__dirname, "..", "..", "public/uploads/products", `resized-${file.filename}`);
    
        // console.log("Processing image:", inputPath, "→", outputPath); // Debugging
    
        await sharp(inputPath)
          .resize(500, 500, { fit: "cover" })  
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toFile(outputPath); // Save processed file with a new name
    
        return `/uploads/products/resized-${file.filename}`; // Return new file path
      })
    );

    if(!discount) discount=0;
    const categories=await Category.findOne({name:category});    
    if(categories.offerApplied && categories.catOffer > discount ){
      const finalPrice = price - (price * (categories.catOffer) / 100);
    }else{
      const finalPrice = price - (price * (discount)) / 100;
    }

    // Save product to the database
    await Product.create({
      name,
      description,
      price,
      discount: discount,
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

  } catch (error) {
    console.error("Error adding product:", error);
    req.flash("error", "An error occurred while adding the product.");
    res.redirect("/admin/products/add");
  }
});
      

const editProduct= asyncHandler(async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId)
      .populate("category")
      .populate("brands");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const categories = await Category.find({});
    const brands = await Brand.find({});

    res.render("edit-product", {
      product,
      categories,
      brands,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Internal Server Error");
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  try {
      const { name, description, price, discount, stock, category, brands, gender, replacedIndexes } = req.body;
      const productId = req.params.id;

      const product = await Product.findById(productId).populate('category');
      if (!product) return res.status(404).json({ error: "Product not found" });

      let errors = {};

      // **VALIDATION**
      if (!name.trim()) errors.name = "Product name is required.";
      if (!description.trim() || description.trim().split(/\s+/).length < 20) 
          errors.description = "Description must be at least 20 words.";
      if (price < 0) errors.price = "Price cannot be negative.";
      if (discount < 0) errors.discount = "Discount cannot be negative.";
      if (stock < 5) errors.stock = "Stock must be at least 5.";

      if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

      // **UPDATE PRODUCT DETAILS**
      product.name = name;
      product.description = description;
      product.price = price;
      product.discount = discount;
      product.stock = stock;
      product.category = category;
      product.brands = brands;
      product.gender = gender;
      
      const productDiscount = product.offerApplied ? product.prodOffer : 0;
      const categoryDiscount = product.category.offerApplied ? product.category.catOffer : 0;
      const defaultDiscount = product.discount || 0;
  
      const maxDiscount = Math.max(productDiscount, categoryDiscount, defaultDiscount);
  
      // Calculate Final Price
      product.finalPrice = parseFloat(
        (product.price - (product.price * maxDiscount) / 100).toFixed(2)
      );
    

      let updatedImages = [...product.images]; // Copy existing images

      // **HANDLE IMAGE REPLACEMENT**
      if (req.files?.replacedImages) {
        const newImages = req.files.replacedImages.map(file => `/uploads/products/${file.filename}`);
    
        if (replacedIndexes) {
            const indexes = JSON.parse(replacedIndexes);  // Ensure it's an array
            indexes.forEach((index, i) => {
                if (index >= 0 && index < updatedImages.length) {
                    updatedImages[index] = newImages[i]; // Correctly replace existing image
                }
            });
        }
    }
      // **HANDLE ADDITIONAL IMAGE UPLOADS**
      if (req.files?.addImages) {
        const additionalImages = req.files.addImages.map(file => `/uploads/products/${file.filename}`);
        updatedImages = [...updatedImages, ...additionalImages]; // Append new images
    }

      // **IMAGE VALIDATION**
      if (updatedImages.length > 5) {
          return res.status(400).json({ errors: { addImage: "You can only upload a maximum of 5 images." } });
      }

      product.images = updatedImages.slice(0, 5); // Ensure max 5 images

      await product.save();

      res.json({ success: true, message: "Product updated successfully", updatedProduct: product });
  } catch (error) {
      console.error("Update Product Error:", error);
      res.status(500).json({ error: "Server error" });
  }
});

const blockProduct=asyncHandler(async(req,res)=>{
  const productId=req.params.id;
  const product=await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found"});
  product.isDeleted=!product.isDeleted;
  await product.save();
  res.json({ success: true, message: product.isDeleted?"Product blocked successfully": "Product unblocked successfully"});
  
});

const addOffer = async (req, res) => {
  try {
    const { productId, offerPercentage } = req.body;

    let product = await Product.findById(productId).populate("category");

    if (!product) {     
      return res.status(statusCodes.NOT_FOUND).json({
        success: false,
        message: "Product Not Found",
      });     
    }

    // Update Product Offer
    product.prodOffer = offerPercentage;
    product.offerApplied = true;

    // Determine the Maximum Discount
    const productDiscount = product.prodOffer || 0;
    const categoryDiscount = product.category?.offerApplied ? product.category.catOffer || 0 : 0;
    const defaultDiscount = product.discount || 0;

    const maxDiscount = Math.max(productDiscount, categoryDiscount, defaultDiscount);

    // Calculate Final Price
    product.finalPrice = parseFloat(
      (product.price - (product.price * maxDiscount) / 100).toFixed(2)
    );

    await product.save();

    return res.status(statusCodes.SUCCESS).json({
      success: true,
      message: "Offer Applied Successfully",
    });

  } catch (err) {
    console.error("Error in addOffer:", err);
    return res.status(statusCodes.SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
};

const removeOffer=async(req,res)=>{
  try{
    const {id}=req.params;
    const product=await Product.findById(id).populate("category");    
    if(!product){
      return res.status(statusCodes.NOT_FOUND).json({success:false,message:"Product Not found"});
    }
    product.offerApplied=false;
    const categoryDiscount = product.category?.offerApplied ? product.category.catOffer || 0 : 0;
    const defaultDiscount = product.discount || 0;

    const maxDiscount = Math.max(categoryDiscount, defaultDiscount);

    // Calculate Final Price
    product.finalPrice = parseFloat(
      (product.price - (product.price * maxDiscount) / 100).toFixed(2)
    );

    await product.save();   
    return res.status(statusCodes.SUCCESS).json({success:true,message:'Offer is Removed'});

  }catch(err){
    console.error(err);
    return res.status(statusCodes.SERVER_ERROR).json({success:false,message:'Internal Server Error'});
  }
}
    
module.exports={
    productList,
    addProductLoad,
    addProduct,
    editProduct,
    updateProduct,
    blockProduct,
    addOffer,
    removeOffer
};

