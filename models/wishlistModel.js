const mongoose = require("mongoose");
const { Schema } = mongoose; // ✅ Import Schema properly

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [{
        productId: {
            type: Schema.Types.ObjectId,    
            ref: "Product",
            required: true
        },
        addedOn: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema); // ✅ Fix typo in model name
module.exports = Wishlist;