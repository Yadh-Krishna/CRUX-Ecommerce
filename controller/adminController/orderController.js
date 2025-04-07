const Product=require('../../models/productModel');
const Category=require('../../models/categoryModal');
const User=require('../../models/userModel')
const Brand=require('../../models/brandModel');  
const asyncHandler = require('express-async-handler');
const Order=require('../../models/orderModal');
const Wallet=require('../../models/walletModel');
const Admin= require('../../models/adminModal');
const upload = require("../../middleware/upload");  //multer 
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');
const {generateInvoice}=require('../../utils/invoiceWrite');
const Coupon=require('../../models/couponModel');

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
        const orderStatusOptions = Order.schema.path("items.status").enumValues;
        order.shippingCost= order.totalAmount > 500 ?0:50; 
        res.render('adminOrderDetails',{order,orderStatusOptions});
    }catch(err){
        console.error(err);
        req.flash("error","Internal Server error!!");
        res.render('adminOrderDetails',{order:null,orderStatusOptions:null});
        
    }
    
}

const orderStatusManage = async (req, res) => {
        try {
            const { id, type } = req.params;
            const { status, orderId } = req.body;

            const order = await Order.findById(orderId)
                .populate("items.product")
                .populate("address user").populate('couponId');

            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            const admin= await Admin.findOne({name:'Administrator'})

            const item = order.items.find(item => item._id.toString() === id);
            if (!item) {
                return res.status(404).json({ success: false, message: "Item not found in order" });
            }

            let refundAmount = (item.product.finalPrice * item.quantity)+((item.product.finalPrice * item.quantity)*0.1);
            let walletUpdated = false;

            // Handle Cancellation & Return Logic
            if (status === "Cancelled" || status === "Returned") {
                if (order.orderStatus !== "Cancelled" && order.orderStatus !== "Returned") {
                    if (item.product) {
                        item.product.stock += item.quantity;
                        await item.product.save();
                    }
                }

                // Wallet Refund (only for Returned)
                if (status === "Returned") {
                    const user = await User.findById(order.user);
                    if (user) {
                        let wallet = await Wallet.findOne({ userId: order.user });
                        if (!wallet) {
                            wallet = new Wallet({ userId: order.user, transactions: [] });
                        }

                        // Adjust refund based on coupon
                        if (order.couponId) {
                            // const coupon = await Coupon.findOne({offerPrice:order.couponPrice});
                            const maxCouponAmount = order.couponId.minimumPrice;
                            let remainingTotal = order.items
                                .filter(i => i.status !== "Cancelled" && i.status !== "Returned" && i._id.toString() !== item._id.toString())
                                .reduce((sum, i) => sum + i.finalPrice, 0);
                            console.log("Remaining Total", remainingTotal);
                                if (remainingTotal === 0) {
                                    refundAmount =refundAmount- order.couponPrice;
                                } else if (remainingTotal < maxCouponAmount) {                                           
                                    refundAmount= refundAmount-order.couponPrice;                                               
                               }
                        }

                        let remainingItems = order.items.filter(i => 
                            i.status !== "Cancelled" && 
                            i.status !== "Returned" && 
                            i._id.toString() !== item._id.toString()
                        );

                        //Deduct delivery charge only if this is the last item being canceled 
                        if (remainingItems.length === 0) {
                        refundAmount -= order.shippingCharge || 0; // Default delivery charge ₹50
                        }

                        wallet.transactions.push({
                            orderId: order._id,
                            transactionType: "credit",
                            transactionAmount: refundAmount > 0 ? refundAmount : 0,
                            transactionDescription: `Refund for returned item ${item._id}`,
                        });

                        await wallet.save();
                        walletUpdated = true;

                           
                           wallet =await Wallet.findOne({userId:admin._id});
                            if(wallet){
                             wallet.transactions.push({
                             orderId:order._id,
                             transactionType:"debit",
                             transactionAmount:refundAmount > 0 ? refundAmount : 0,
                             transactionStatus:"completed",
                             transactionDescription:`Refund for return order ${order.orderId}`
                             });
                              }
                              await wallet.save();                                           
                    }
                }
            }

            // Generate Invoice for Delivered Items
            if (status === "Delivered") {
                const invoiceFileName = `invoice_${order.orderId}_${item._id}.pdf`;
                const invoicePath = path.join(__dirname, "../../public/invoices", invoiceFileName);

                generateInvoice(order, item, invoicePath);
                item.invoiceUrl = `/invoices/${invoiceFileName}`;
                let wallet =await Wallet.findOne({userId:admin._id});
                            if(wallet){
                             wallet.transactions.push({
                             orderId:order._id,
                             transactionType:"credit",
                             transactionAmount:order.totalAmount,
                             transactionStatus:"completed",
                             transactionDescription:`Credited amount for order ${order.orderId}`
                             });
                              }
                              await wallet.save();    

            }

            // Update Item Status
            item.status = status;
            await order.save();

            // Check if all items have the same status, update order status accordingly

            const uniqueStatuses = new Set(order.items.map(i => i.status));
            if (uniqueStatuses.size === 1) {
                order.orderStatus = [...uniqueStatuses][0]; // Set order status to the common status
            }
            await order.save();

            res.status(200).json({
                success: true,
                message: "Order status updated successfully",
                walletUpdated: walletUpdated,
                refundAmount: walletUpdated ? refundAmount : 0,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    };

const downloadInvoice= async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        const filePath = path.join(__dirname, '../../public/invoices', `invoice_${orderId}.pdf`);
    
        // Check if the file exists
        if (fs.existsSync(filePath)) {
            res.download(filePath, `invoice_${orderId}.pdf`); // Download the file
        } else {
            res.status(404).json({ success: false, message: "Invoice not found" });
        }
       }catch(err){
        console.error(err);
       }
    }   


module.exports={
    orderList,
    orderDetails,
    orderStatusManage,
    downloadInvoice
}