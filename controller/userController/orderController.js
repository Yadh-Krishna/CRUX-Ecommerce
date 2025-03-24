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
const Wallet=require('../../models/walletModel');


const cancelOrderItem=async(req,res)=>{
    try {
        const { entityId, type, orderId } = req.params;
        const { reason, otherReason } = req.body;

        if (type === "order") {
           
            const order = await Order.findById(entityId);
            if (!order) {
                return res.status(404).json({ success:false, message: "Order not found" });
            }
            
            

            const allItemsSameStatus = order.items.every(item => item.status === order.items[0].status);
            if(!allItemsSameStatus)
                return res.status(statusCodes.CONFLICT).json({success:false,message:"You shall cancel the order item by item"});
            else{     

            order.orderStatus = "Cancelled";
            order.cancellationReason = otherReason || reason;

            if(order.cancellationReason){
                for(const item of order.items){
                    item.cancellationReason=order.cancellationReason;
                }
            }
                
            for (const item of order.items) {
                item.status = "Cancelled";
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity; 
                    await product.save();
                }
            }           
            
            if(order.paymentMethod==='Online'){
                let wallet=await Wallet.findOne({userId:order.user});
                console
                if(!wallet){
                    wallet= new Wallet({
                        userId:order.user,
                        transactions:[]
                    })
                    
                }
                wallet.transactions.push({
                    orderId:order._id,
                    transactionType:"credit",
                    transactionAmount:order.totalAmount,
                    transactionStatus:"completed",
                    transactionDescription:`Refund for cancelled order ${order.orderId}`
                })
                await wallet.save();
            }   
            await order.save();
            res.status(statusCodes.SUCCESS).json({success:true, message: "Order cancelled successfully" });
            }
            } else if (type === "item") {
            const order = await Order.findById(orderId).populate("items.product");
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
        res.status(500).json({success:false,message: "Server error" });
    }
}

const returnOrderItem = async (req, res) => {
    try {        
        const { orderId, entityId,type } = req.params; 
        const { reason, otherReason } = req.body;
        if (type === "order") {
            // Handle order return
            const order = await Order.findById(orderId).populate("items.product");
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            const allItemsSameStatus = order.items.every(item => item.status === 'Delivered');
            if(!allItemsSameStatus)
                return res.status(statusCodes.CONFLICT).json({success:false,message:"You shall return the order item by item"});
            else{                
           
            // Update order status and reason
            order.orderStatus = "Return Requested";
            order.refundReason = otherReason || reason;
            if(order.refundReason){
                for(const item of order.items){
                    item.refundReason=order.refundReason;
                }
            }

            // Update item statuses and restore product stock
            for (const item of order.items) {
                item.status = "Return Requested";
                }

            await order.save();
            res.status(statusCodes.SUCCESS).json({ success: true, message: "Order return request sent" });
        }
        } else if (type === "item") {
            // Handle item return
            const order = await Order.findById(orderId).populate("items.product");
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            // Find the specific item in the order
            const item = order.items.id(entityId);
            if (!item) {
                return res.status(404).json({ success: false, message: "Item not found in the order" });
            }

            // Update item status and reason
            item.status = "Return Requested";
            item.refundReason = otherReason || reason;

            // Restore product stock
            const product = item.product;
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }

            // Check if all items in the order are cancelled
            const allItemsCancelled = order.items.every((item) => item.status === "Return Requested");
            if (allItemsCancelled) {
                order.orderStatus = "Return Requested";
            }

            await order.save();
            res.status(200).json({ success: true, message: "Item return request sent" });
        } 
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports={
    cancelOrderItem,
    returnOrderItem
};