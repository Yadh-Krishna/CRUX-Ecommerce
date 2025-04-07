const Category=require('../../models/categoryModal');
const Product=require('../../models/productModel');
const Offer=require('../../models/offerModel')
const asyncHandler=require('express-async-handler');
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')

const categoryList= asyncHandler(async (req, res) => {
    const searchQuery = req.query.searchCategories || "";
    const statusFilter = req.query.status || "Show all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (searchQuery) {
        filter.name = { $regex: searchQuery, $options: "i" };
    }

    if (statusFilter === "Active") {
        filter.isDeleted = false;
    } else if (statusFilter === "Inactive") {
        filter.isDeleted = true;
    }

    const totalCategories = await Category.countDocuments(filter);
    let categories = await Category.find(filter).sort({name:1}).skip(skip).limit(limit);        

    res.render("category", {
        categories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        searchQuery,
        statusFilter,
        limit,
    });
});

const addCategoryLoad=asyncHandler((req,res)=>{
  res.render('create-category');
});


const addCategory=asyncHandler(async (req, res) => {  
  
    const { name, description } = req.body;

    // Ensure an image is uploaded
    if (!req.file) {
      req.flash("error", "Category image is required.");
      return res.redirect("/admin/categories/add");
  }

        // Check if category already exists (Case-Insensitive)
    const existingCategory = await Category.findOne({
        name: { $regex: name.trim(),$options:'i'}
    });

    if (existingCategory) {
        req.flash("error", "Category already exists.");
        return res.redirect("/admin/categories/add");
    }

    // Save new category
    await Category.create({
        name: name.trim(),
        description: description.trim(),
        image: `/uploads/categories/${req.file.filename}`,
        isDeleted: false, // Default to active
    });

    req.flash("success", "Category added successfully.");
    res.redirect("/admin/categories");
});

const editCategoryLoad= asyncHandler(async (req, res) => {

  const category = await Category.findById(req.params.id);
  if (!category) {
      throw new Error("Category not found."); // Automatically caught and passed to the error handler
  }
  res.render("edit-category", { category });
});


const editCategory=asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const categoryId = req.params.id;
  
  const category = await Category.findById(categoryId);
  if (!category) {
      req.flash("error", "Category not found.");
      return res.redirect("/admin/categories");
  }

  // Prepare update data
  let updateData = { name, description };

  // If a new image is uploaded, update it
  if (req.file) {
      updateData.image = `/uploads/categories/${req.file.filename}`;
  }

  // Update the category
  await Category.findByIdAndUpdate(categoryId, updateData);

  req.flash("success", "Category updated successfully.");
  res.redirect("/admin/categories");
});

const blockCategory=asyncHandler(async (req, res) => {  
  const categoryId = req.params.id;
  const category = await Category.findById(categoryId);

  if (!category) {
      req.flash("error", "Category not found.");
      return res.status(404).json({ success: false, message: req.flash("error")[0] });
  }

  // Toggle isDeleted status
  category.isDeleted = !category.isDeleted;
  await category.save();

  req.flash("success", category.isDeleted ? "Category blocked successfully." : "Category unblocked successfully.");
  res.json({ success: true, message: req.flash("success") });

  });

const applyOffer = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { offerPercentage } = req.body;
  
      // Find or create an offer
      let category = await Category.findById(categoryId);
      let products=await Product.find({category:categoryId})
      if (!category) {
       return res.status(400).json({success:false,message:"No category found"})
      } else {
        category.catOffer = offerPercentage;
        category.offerApplied = true;
        await category.save();

        for (let product of products) {
          const productDiscount = product.offerApplied ? product.prodOffer || 0 : 0;
          const categoryDiscount = category.offerApplied ? category.catOffer || 0 : 0;
          const defaultDiscount = product.discount || 0;
    
          const maxDiscount = Math.max(productDiscount, categoryDiscount, defaultDiscount);
    
          product.finalPrice = parseFloat(
            (product.price - (product.price * maxDiscount) / 100).toFixed(2)
          );
    
          await product.save(); // Save each product
        }        
      }
  
      return res.status(200).json({ success: true, message: "Offer applied successfully!" });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };

const removeOffer = async (req, res) => {
    try {
      const { categoryId } = req.params; 
      
      const category = await Category.findById(categoryId);
      if (category) {
        category.offerApplied = false;
        await category.save();

        let products=await Product.find({category:categoryId})
        for (let product of products) {
          const productDiscount = product.offerApplied ? product.prodOffer || 0 : 0;
          const categoryDiscount = category.offerApplied ? category.catOffer || 0 : 0;
          const defaultDiscount = product.discount || 0;
    
          const maxDiscount = Math.max(productDiscount, categoryDiscount, defaultDiscount);
    
          product.finalPrice = parseFloat(
            (product.price - (product.price * maxDiscount) / 100).toFixed(2)
          );
    
          await product.save(); // Save each product
        }


      }else{
        return res.status(statusCodes.NOT_FOUND).json({ success: false, message: "Category not found" });
      }
      return res.status(statusCodes.SUCCESS).json({ success: true, message: "Offer removed successfully!" });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }; 
 

module.exports={
    categoryList,
    addCategoryLoad,
    addCategory,
    editCategoryLoad,
    editCategory,
    blockCategory,
    applyOffer,
    removeOffer

}