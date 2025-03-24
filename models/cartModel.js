const mongoose=require('mongoose');

const cartSchema=new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, min: 1 }
        }
    ],
    appliedCoupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null } 
}, { timestamps: true });

module.exports=new mongoose.model('Cart', cartSchema);
