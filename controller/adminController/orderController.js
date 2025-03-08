const Product=require('../../models/productModel');
const Category=require('../../models/categoryModal');
const User=require('../../models/userModel')
const Brand=require('../../models/brandModel');  
const asyncHandler = require('express-async-handler');
const Order=require('../../models/orderModal');
const Wallet=require('../../models/walletModel');
const upload = require("../../middleware/upload");  //multer 
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');
const {generateInvoice}=require('../../utils/invoiceWrite')

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
        const orderStatusOptions = Order.schema.path("orderStatus").enumValues;
        order.shippingCost= order.totalAmount > 500 ?0:50; 
        res.render('adminOrderDetails',{order,orderStatusOptions});
    }catch(err){
        console.error(err);
    }
    
}

const orderStatusManage = async (req, res) => {
    try {
        const { id, type } = req.params;
        const { status } = req.body;

        // Find the order and populate product details
        const order = await Order.findById(id).populate("items.product").populate('address user');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Handle cancellation or return
        if (status === "Cancelled" || status === "Returned") {
            // Check if the order was not already cancelled or returned
            if (order.orderStatus !== "Cancelled" && order.orderStatus !== "Returned") {
                // Restore stock for each item in the order
                for (const item of order.items) {
                    const product = item.product;
                    if (product) {
                        product.stock += item.quantity; // Restore stock
                        await product.save(); // Save each product inside the loop
                    }
                }
            }

            // Refund to wallet if returned
            if (status === "Returned") {
                const user = await User.findById(order.user);
                if (user) {
                    let wallet = await Wallet.findOne({ userId: order.user });
                    if (!wallet) {
                        // Create a new wallet if it doesn't exist
                        wallet = new Wallet({
                            userId: order.user,
                            transactions: [],
                        });
                    }
                    try{
                        // Add refund transaction to the wallet
                    wallet.transactions.push({
                        orderId: order._id, // Use order._id instead of order.orderId
                        transactionType: "credit",
                        transactionAmount: order.totalAmount,
                        transactionDescription: `Refund for returned order ${order.orderId}`,
                    });
                    
                    await wallet.save(); // Ensure the wallet is saved after adding the transaction                   
                }catch(err){
                    console.log(err);
                }
                    }
                    
            }
        }

        // Update order status and item statuses
        order.orderStatus = status;
        for (const item of order.items) {
            item.status = status; // Update item status to match order status
        }

        if (status === "Delivered") {
            const invoiceFileName = `invoice_${order.orderId}.pdf`;
            const invoicePath = path.join(__dirname, '../../public/invoices', invoiceFileName);

            // Generate the invoice
            const relativeInvoicePath = generateInvoice(order, invoicePath);

            // Save the invoice URL in the order document
            order.invoiceUrl = `/invoices/${invoiceFileName}`;
        }

        await order.save();

        res.status(200).json({ success: true, message: "Order status updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
    


module.exports={
    orderList,
    orderDetails,
    orderStatusManage
}