const Brand=require('../../models/dbrands');

const brandList= async (req, res) => {
    try {
        const searchTerm = req.query.searchBrands || ""; // Search functionality
        const query = searchTerm
            ? { name: { $regex: new RegExp(searchTerm, "i") } }
            : {};

        const brands = await Brand.find(query).sort({ name: 1 }); // Sorted in ascending order
        res.render("brand", { brands, searchTerm });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
}

const addBrand=async (req, res) => {
    try {
        const { name, description } = req.body;
        console.log(name,description)
        if (!name) {
            req.flash("error", "Category name is required.");
            return res.redirect("/admin/brands");
        }

             // Check if category already exists (Case Insensitive)
             const existingBrand = await Brand.findOne({ name: { $regex: new RegExp("^" + name + "$", "i") } });
             if (existingBrand) {
                 req.flash("error", "Category already exists.");
                 return res.redirect("/admin/brands");
             }

        const newBrand = new Brand({
            name,
            description,
            image: req.file ? `/uploads/brands/${req.file.filename}` : null,
            isDeleted: false, // Default to active
        });

        await newBrand.save();
        req.flash("success", "Category added successfully.");
        res.redirect("/admin/brands");
    } catch (error) {
        console.error("Error adding category:", error);
        req.flash("error", "Failed to add category.");
        res.redirect("/admin/brands");  
    }
}

const editBrand=async (req, res) => {
    try {
      const { name, description } = req.body;
      const brandId = req.params.id;
      
      const brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found." });
      }
  
      // Prepare update data
      let updateData = { name, description };
  
      // If a new image is uploaded, update it
      if (req.file) {
        updateData.image = `/uploads/brands/${req.file.filename}`;
      }
  
      // Update the category
      await Brand.findByIdAndUpdate(brandId, updateData);
      res.json({ message: "Brand updated successfully." });
  
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(500).json({ error: "Failed to update brand." });
    }
  }

const blockBrand= async (req, res) => {
    try {
      const brandId = req.params.id;
      
      const brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found." });
      }
  
      // Toggle isDeleted status
      brand.isDeleted = !brand.isDeleted;
      await brand.save();
  
      res.json({
        message: brand.isDeleted ? "Category deactivated successfully." : "Category activated successfully.",
      });
  
    } catch (error) {
      console.error("Error toggling category status:", error);
      res.status(500).json({ error: "Failed to update category status." });
    }
  }

module.exports={
    brandList,
    addBrand,
    editBrand,
    blockBrand  
}