const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages');
const crypto = require("crypto");
require("dotenv").config();
const Wishlist=require('../../models/wishlistModel');
const Order=require('../../models/orderModal');
const sendOTP =require('../../utils/sendOTP'); 
const Product=require('../../models/productModel')
const Cart=require('../../models/cartModel');

const cancelOrderItem=async(req,res)=>{
    try {
        const { entityId, type } = req.params;
        const { reason, otherReason } = req.body;

        if (type === "order") {
           
            const order = await Order.findById(entityId);
            if (!order) {
                return res.status(404).json({ success:false, message: "Order not found" });
            }
            
            order.orderStatus = "Cancelled";
            order.cancellationReason = otherReason || reason;

            
            for (const item of order.items) {
                item.status = "Cancelled";
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity; 
                    await product.save();
                }
            }
            await order.save();
            res.status(statusCodes.SUCCESS).json({success:true, message: "Order cancelled successfully" });
        } else if (type === "item") {
            const order = await Order.findOne({ "items._id": entityId });
            if (!order) {
                return res.status(404).json({ success:true, message: "Order or item not found" });
            }

            const item = order.items.id(entityId);
            item.status = "Cancelled";
            item.cancellationReason = otherReason || reason;
            const arr=[];
            for(const x of order.items){
                arr.push(x.status);
            }
            if(arr.every(x=>x==="Cancelled")){
                order.orderStatus="Cancelled";  
            }
            // Restore product quantity
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }

            await order.save();
            res.status(200).json({ success:true,message: "Item cancelled successfully" });
        } else {
            return res.status(400).json({ error: "Invalid type" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports={
    cancelOrderItem
};