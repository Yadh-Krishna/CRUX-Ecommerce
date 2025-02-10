const Category=require('../../models/dbcategory');
const asyncHandler=require('express-async-handler');

const categoryList= asyncHandler(async (req, res) => {
  const searchQuery = req.query.searchCategories || "";
  const statusFilter = req.query.status || "Show all";

  // Create a search condition for category name (case-insensitive)
  let filter = {};
  if (searchQuery) {
      filter.name = { $regex: searchQuery,$options:'i' }; 
  }

  // Apply status filter (if not "Show all")
  if (statusFilter === "Active") {
      filter.isDeleted = false;
  } else if (statusFilter === "Inactive") {
      filter.isDeleted = true;
  }

  const categories = await Category.find(filter);
  res.render("category", { categories});
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

  
 

module.exports={
    categoryList,
    addCategoryLoad,
    addCategory,
    editCategoryLoad,
    editCategory,
    blockCategory
}