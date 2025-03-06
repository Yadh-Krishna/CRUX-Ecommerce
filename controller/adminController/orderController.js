const Product=require('../../models/productModel');
const Category=require('../../models/categoryModal');
const Brand=require('../../models/brandModel');  
const asyncHandler = require('express-async-handler');
const Order=require('../../models/orderModal');

const upload = require("../../middleware/upload");  //multer 
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');

const orderList= async(req,res)=>{
           try {
            const { search, status, page = 1, limit = 20 } = req.query;
    
            let query = {}; // Default query
    
            // Search by Order ID, User Name, or Email
            if (search) {
                query.$or = [
                    { orderId: { $regex: search, $options: "i" } }, // Order ID search
                    { "user.name": { $regex: search, $options: "i" } }, // Name search
                    { "user.email": { $regex: search, $options: "i" } } // Email search
                ];
            }
    
            // Filter by Order Status
            if (status && status !== "Status") {
                query.orderStatus = status;
            }
    
            // Pagination logic
            const pageNumber = parseInt(page, 10);
            const pageSize = parseInt(limit, 10);
    
            const orders = await Order.find(query)
                .populate("user", "fullName email") // Fetch user details
                .sort({ createdAt: -1 }) // Newest orders first
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize);
    
            const totalOrders = await Order.countDocuments(query);
            const totalPages = Math.ceil(totalOrders / pageSize);
    
            res.render("order-lists", {
                orders,
                currentPage: pageNumber,
                totalPages
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).send("Server Error");
        }
    }

const orderDetails=async(req,res)=>{
    try{
        const orderId=req.params.id
        const order=await Order.findById(orderId).populate('address items.product').populate('user','fullName email mobile  ');
        order.shippingCost= order.totalAmount > 500 ?0:50; 
        res.render('adminOrderDetails',{order});
    }catch(err){
        console.error(err);
    }
    
}
    


module.exports={
    orderList,
    orderDetails
}