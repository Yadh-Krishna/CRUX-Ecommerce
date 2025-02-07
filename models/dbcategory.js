const mongoose=require('mongoose');
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    image: {
      type: String, // Store image URL or file path
      default: "/logo/category-brand-default-img.jpg"
    },
    isDeleted: {
      type: Boolean,
      default: false // Soft delete feature
    }
  },
  { timestamps: true } // Adds createdAt & updatedAt
);

// Auto-generate slug before saving
categorySchema.pre("save", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});
  
  module.exports = mongoose.model('category', categorySchema);