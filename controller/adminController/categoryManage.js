const Category=require('../../models/dbcategory');

const categoryList= async (req, res) => {
    try {
        const searchTerm = req.query.searchCategories || ""; // Search functionality
        const query = searchTerm
            ? { name: { $regex: new RegExp(searchTerm, "i") } }
            : {};

        const categories = await Category.find(query).sort({ name: 1 }); // Sorted in ascending order
        res.render("category", { categories, searchTerm });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
}

const addCategory=async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            req.flash("error", "Category name is required.");
            return res.redirect("/admin/categories");
        }

             // Check if category already exists (Case Insensitive)
             const existingCategory = await Category.findOne({ name: { $regex: new RegExp("^" + name + "$", "i") } });
             if (existingCategory) {
                 req.flash("error", "Category already exists.");
                 return res.redirect("/admin/categories");
             }

        const newCategory = new Category({
            name,
            description,
            image: req.file ? `/uploads/categories/${req.file.filename}` : null,
            isDeleted: false, // Default to active
        });

        await newCategory.save();
        req.flash("success", "Category added successfully.");
        res.redirect("/admin/categories");
    } catch (error) {
        console.error("Error adding category:", error);
        req.flash("error", "Failed to add category.");
        res.redirect("/admin/categories");
    }
}

const editCategory=async (req, res) => {
    try {
      const { name, description } = req.body;
      const categoryId = req.params.id;
      
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found." });
      }
  
      // Prepare update data
      let updateData = { name, description };
  
      // If a new image is uploaded, update it
      if (req.file) {
        updateData.image = `/uploads/categories/${req.file.filename}`;
      }
  
      // Update the category
      await Category.findByIdAndUpdate(categoryId, updateData);
      res.json({ message: "Category updated successfully." });
  
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category." });
    }
  }

const blockCategory=async (req, res) => {
    try {
      const categoryId = req.params.id;
      
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found." });
      }
  
      // Toggle isDeleted status
      category.isDeleted = !category.isDeleted;
      await category.save();
  
      res.json({
        message: category.isDeleted ? "Category deactivated successfully." : "Category activated successfully.",
      });
  
    } catch (error) {
      console.error("Error toggling category status:", error);
      res.status(500).json({ error: "Failed to update category status." });
    }
  }

  const searchCategory=async (req, res) => {
    try {
        const { searchCategories } = req.query; // Use `req.query` for search input

        // If no search term is provided, return all categories
        let filter = {};
        if (searchCategories) {
            filter.name = { $regex: searchCategories, $options: "i" };
        }

        const categories = await Category.find(filter);

        // Check if categories exist
        // if (categories.length === 0) {
            return res.render('category',{categories});       

        
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories." });
    }
}

module.exports={
    categoryList,
    addCategory,
    editCategory,
    blockCategory,
    searchCategory
}