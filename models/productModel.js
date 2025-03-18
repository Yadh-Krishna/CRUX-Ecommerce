const mongoose = require('mongoose');
const slugify = require("slugify");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true }, // New Slug Field
  description: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, 
  finalPrice: { type: Number },  
  stock: { type: Number, required: true },
  images: [{ type: String, required: true }],  // Ensure at least 3 images
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
  brands: { type: mongoose.Schema.Types.ObjectId, ref: 'brand' }, 
  gender: { type: String, enum: ["Men", "Women", "Unisex"], required: true },
  ratings: { type: Number, default: 0 },
  tags: [{ type: String }],
  isDeleted: { type: Boolean, default: false },
  prodOffer:{type:Number,default:0},
  offerApplied:{type: Boolean, default: false}
}, { timestamps: true });
  
ProductSchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    let slug = slugify(this.name, { lower: true, strict: true });

    // Ensure uniqueness by appending a number if a duplicate exists
    let existingProduct = await this.constructor.findOne({ slug });
    let counter = 1;

    while (existingProduct) {
      slug = `${slug}-${counter}`;
      existingProduct = await this.constructor.findOne({ slug });
      counter++;
    }

    this.slug = slug;
  }
  next();
});
  module.exports = mongoose.model('Product', ProductSchema);