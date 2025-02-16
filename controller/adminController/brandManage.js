const Brand=require('../../models/brandModel');
const asyncHandler=require('express-async-handler');

const brandList= asyncHandler(async (req, res) => {
  const searchQuery = req.query.searchbrands || "";
  const statusFilter = req.query.status || "Show all";

  // Create a search condition for brand name (case-insensitive)
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

  const brands = await Brand.find(filter).sort({name:1});
  res.render("brand", { brands});
});

const addBrandLoad=asyncHandler((req,res)=>{
  res.render("add-brand");
});

const addBrand=asyncHandler(async (req, res) => {  
  
    const { name, description } = req.body;

    // Ensure an image is uploaded
    if (!req.file) {
      req.flash("error", "Brand image is required.");
      return res.redirect("/admin/brands/add");
  }

        // Check if category already exists (Case-Insensitive)
    const existingBrand = await Brand.findOne({
        name: { $regex: name.trim(),$options:'i'}
    });

    if (existingBrand) {
        req.flash("error", "Brand already exists.");
        return res.redirect("/admin/brands/add");
    }

    // Save new category
    await Brand.create({
        name: name.trim(),
        description: description.trim(),
        image: `/uploads/brands/${req.file.filename}`,
        isDeleted: false, // Default to active
    });

    req.flash("success", "Category added successfully.");
    res.redirect("/admin/brands");
});

const editBrandLoad=asyncHandler(async (req, res) => {

  const brand = await Brand.findById(req.params.id);
  if (!brand) {
      throw new Error("Category not found."); // Automatically caught and passed to the error handler
  }
  res.render("edit-brand", { brand });
});

const editBrand=asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const brandId = req.params.id;
  
  const brand = await Brand.findById(brandId);
  if (!brand) {
      req.flash("error", "Brand not found.");
      return res.redirect("/admin/brands");
  }

  // Prepare update data
  let updateData = { name, description };

  // If a new image is uploaded, update it
  if (req.file) {
      updateData.image = `/uploads/brands/${req.file.filename}`;
  }

  // Update the category
  await Brand.findByIdAndUpdate(brandId, updateData);

  req.flash("success", "Brand updated successfully.");
  res.redirect("/admin/brands");
});

const blockBrand= asyncHandler(async (req, res) => {  
  const brandId = req.params.id;
  const brand = await Brand.findById(brandId);

  if (!brand) {
      req.flash("error", "Brand not found.");
      return res.status(404).json({ success: false, message: req.flash("error")[0] });
  }

  // Toggle isDeleted status
  brand.isDeleted = !brand.isDeleted;
  await brand.save();

  req.flash("success", brand.isDeleted ? "Brand blocked successfully." : "Brand unblocked successfully.");
  res.json({ success: true, message: req.flash("success")[0] });

  });

module.exports={
    brandList,
    addBrandLoad,
    addBrand,
    editBrandLoad,
    editBrand,
    blockBrand  
}