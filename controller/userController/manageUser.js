const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const Wishlist=require('../../models/wishlistModel')
const Wallet=require('../../models/walletModel');
const Cart=require('../../models/cartModel')
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const path=require('path');
const fs=require('fs');

const Review=require('../../models/reviewModel')
const Order=require('../../models/orderModal');
const Address= require('../../models/addressModal');
const Product=require('../../models/productModel');

const sendOTP =require('../../utils/sendOTP'); 

const loadProfile=async(req,res)=>{
    try{
        console.log(req.user);
        const user= await User.findById(req.user.userId);        
        
        if(!user.isActive){
            req.flash("error","User is Blocked");
            res.redirect('/');
        }
        res.render('profile',{user,addresses:[]});        
           
        
    }catch(err){
        console.error(err);
        res.status(statusCodes.SERVER_ERROR).json(errorMessages.SERVER.SERVER_ERROR);
    }
    
}

const editProfile= async(req,res)=>{
    try{
        const user= await User.findById(req.user.userId);
        if(!user){
            req.flash("error", "User not found");
            res.render('edit-profile',{user:null})
        }
        if(!user.isActive){
            req.flash("error","User is Blocked");
            res.redirect('/');
    }
    res.render('edit-profile',{user});

}catch(err){
    console.error(err);
}
}

const verifyEmail=async(req,res)=>{
    try{
        const {email}=req.body;
        const userId= req.user.userId; 
        const user=await User.findById(userId);
        if(user.email===email){            
           return res.status(400).json({success:false,message:"No change in email"});
        }
        if(!user.isActive){            
        return res.status(403).json({success:false,message:errorMessages.USER.BLOCKED});     
      }
      const users=await User.findOne({email})
      if(users){
        return res.status(409).json({success:false,message:errorMessages.USER.ALREADY_EXISTS});
      }
            
      const otp= crypto.randomInt(100000,999999);
      const otpExpires= Date.now()+60000; // Otp valid for 1 minute
      console.log("Verify OTP",otp);
      user.otp= otp;
      user.otpExpires= otpExpires;  
      await user.save();

      await sendOTP(email,otp,"verify-email");

      return res.status(200).json({ success:true,message: "OTP sent successfully" });

}catch(err){
    console.error("Error Verifying mail : ",err);
    res.status(errorMessages.SERVER.SERVER_ERROR).json({success:false,message:"Something Went Wrong!!"})
}
}

const verifyOTP= async(req,res)=>{
    try{
        const userId = req.user.userId;
        const {otp,email}=req.body;
        const user=await User.findById(userId);
        if(!user){
           return res.status(statusCodes.NOT_FOUND).json({success:false,message:errorMessages.USER.NOT_FOUND});
         }
        if(!user.otp==otp ||user.otpExpires < Date.now()){
            return res.status(statusCodes.UNAUTHORIZED).json({success:false,message:"Invalid or expired OTP "});
        }
        
        user.otp=otp;
        user.email=email;
        await user.save();

        return res.status(statusCodes.SUCCESS).json({success:true,message:"Email Verified successfully"});
        
        }catch(err){
            console.error(err);
            res.status(statusCodes.SERVER_ERROR).json({success:false,message:"Something Went wrong.. Try Again!!"});
        
    }
}

const updateChanges = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(statusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        const { fullName, mobile, dateOfBirth, gender } = req.body;

        // Validate Full Name
        if (!fullName || fullName.trim() === "") {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Full Name is required"
            });
        }

        // Validate Phone Number (must be exactly 10 digits)
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Phone number should be exactly 10 digits"
            });
        }

        // Validate Gender (allowed values: male, female, other)
        const validGenders = ["male", "female", "other"];
        if (gender && !validGenders.includes(gender.toLowerCase())) {
            return res.status(statusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid gender. Allowed values: male, female, other"
            });
        }

        // Validate Date of Birth (YYYY-MM-DD format check)
        if (dateOfBirth) {
            const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dobRegex.test(dateOfBirth)) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Invalid date format. Use YYYY-MM-DD"
                });
            }

            // Ensure the user is at least 13 years old
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13) {
                return res.status(statusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "You must be at least 13 years old"
                });
            }

            user.dateOfBirth = dateOfBirth;
        }

        // Update user details
        user.fullName = fullName.trim();
        user.mobile = mobile;
        if (gender) user.gender = gender.toLowerCase();

        // Handle profile image update
        if (req.file) {
            user.image = `/uploads/edit/${req.file.filename}`;
        }

        await user.save();

        return res.status(statusCodes.SUCCESS).json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (err) {
        console.error("Profile Update Error:", err);
        return res.status(statusCodes.SERVER_ERROR).json({
            success: false,
            message: "Something went wrong while updating the profile"
        });
    }
};

const changePassword= async(req,res)=>{
    try{
        const userId=req.user.userId;
        const user= await User.findById(userId);
        const {currentPassword,newPassword,confirmPassword}=req.body;

        console.log(req.body);
        if(!user){
            return res.status(statusCodes.NOT_FOUND).json({success:false,message:"User not found"});
        }

        const isMatch= await bcrypt.compare(currentPassword,user.password);
        if(!isMatch){
            return res.status(statusCodes.UNAUTHORIZED).json({success:false,message:"Current password is incorrect"});
        }       
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(statusCodes.SUCCESS).json({ success: true, message: "Password changed successfully!" });

    }catch(err){
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



const loadAddress=async(req,res)=>{
    try{
        const user=await User.findById(req.user.userId);
        if(!user){
            req.flash("error","User not found");
            res.render('profile',{user:null});
        }
        const addresses= await Address.find({user:user._id,isDeleted:false});
        if(!addresses){
            req.flash("error","Address not found");
            res.render('address',{addresses:[],user});
        }
        res.render('address',{addresses,user});
        }catch(err){
            console.error(err);
            req.flash("error","Something Went Wrong")
            res.render('profile',{addresses:[],user:[]});            
    }

}

const editPage=async(req,res)=>{
    try{
        const id=req.params.id;
        const user=await User.findById(req.user.userId);
        if(!user){
            req.flash("error","User not found");
            return res.render('profile',{user:null});            
    }
        const address=await Address.findById(id);
        if(!address){
            req.flash("error","Address not found");
           return res.render('address',{addresses:[],user});
        }
        return res.render('edit-address',{address,user});

}catch(err){
    console.error(err);
    req.flash("error","Something Went Wrong");
    return res.render('profile',{user:null});
}
}

const addAddress=async(req,res)=>{
    try{        
        const {name,hName,street,city,zip,country,state,type,phone, makeDefault }=req.body;
        const user=await User.findById(req.user.userId);
        if(!user){
            req.flash("error","User not found");
            res.render('profile',{user:null});
        }

        if (makeDefault) {
            await Address.updateMany({ user: user._id, isDefault: true }, { isDefault: false });
        }


        const address= new Address({
            name,hName,street,city,pin:zip,country,state,address_type:type,mobile_number:phone,user:user._id,isDefault:makeDefault ?true:false});
            await address.save();
            req.flash("success","Address Added Successfully");
            return res.redirect(req.get('Referer') || '/profile/addresses');
            

    }catch(err){
        req.flash("error","Something Went Wrong");
        res.redirect('/profile/addresses');
    }
}

const updateAddress= async(req,res)=>{
    try{
        const {id}=req.params;
        const formData = req.body;
        const user=await User.findById(req.user.userId);
        if(!user){            
           return res.status(statusCodes.NOT_FOUND).json({success:false,message:"User not found"})
        }
        const addressCheck=await Address.findById(id);
        if(!addressCheck){           
           return res.status(statusCodes.NOT_FOUND).json({success:false,message:"Address not found"})
        }
        const address=await Address.findByIdAndUpdate(id,formData);
        
        res.status(statusCodes.SUCCESS).json({success:true,message:"Address updated successfully"});
    }catch(err){
        console.log(err);
        req.flash("error","Something Went Wrong");
        res.redirect('/profile/addresses');
    }
}

const deleteAddress=async(req,res)=>{
    try{
        const {id}=req.params;
        const user=await User.findById(req.user.userId);
        if(!user){
            res.status(statusCodes.NOT_FOUND).json({success:false,message:"User not Found"})
        }
        const addressCheck=await Address.findById(id);
        if(!addressCheck){
            res.status(statusCodes.NOT_FOUND).json({success:false,message:"Address not found"})
        }
        addressCheck.isDeleted=!addressCheck.isDeleted
        await addressCheck.save();
        res.status(statusCodes.SUCCESS).json({success:true,message:"Address deleted Successfully"})
    }catch(err){
        console.log(err);
        res.status(statusCodes.SERVER_ERROR).json({success:false,message:"Something went Wrong!!"})
    }
}

const defaultAddress= async(req,res)=>{
    try{
        const {id}=req.params;
        const userId=req.user.userId;
        const user=await User.findById(userId);
        if(!user){
            res.status(statusCodes.NOT_FOUND).json({success:false,message:"User not found"});
        }
        const address=await Address.findById(id);
        if(!address){
            res.status(statusCodes.NOT_FOUND).json({success:false,message:"Address not found"});
        }
        await Address.updateMany({user:userId},{$set:{isDefault:false}});
        
        address.isDefault=true;
        await address.save();

        res.status(statusCodes.SUCCESS).json({success:true,message:"Address defaulted successfully"});        
    }catch(err){
        console.log(err);
        res.status(statusCodes.SERVER_ERROR).json({success:false,message:"Something Went Wrong!!"});
    }
}

const orderList=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const user=await User.findById(userId);
        if(!user){
            req.flash("error","User not found");
            res.redirect('/login');
        }
        const orders= await Order.find({user:userId}).populate('items.product').sort({createdAt:-1});
        
        if(!orders){
            req.flash("error","No Orders Available");
            res.render('orders',{orders:null,user})
        }

        res.render('orders',{orders,user});
            
        }catch(err){
            console.error(err);
            req.flash("error","Something Went Wrong, Try logging again !!");
    }

}

const loadWishlist=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const user= await User.findById(userId);
        

        let wishlist= await Wishlist.findOne({userId:user._id}).populate('products.productId');
        if(!wishlist){
            wishlist=new Wishlist({
                userId,
                products:[]
            })
        }
        // console.log(wishlist.products);
        res.render('wishlist',{user,wishlist:wishlist.products});

    }catch(err){
        console.log(err);
        res.redirect('/');
    }
}

const addWishlist=async(req,res)=>{
    try{
        const userId=req.user.userId;
        if(!userId){
            return res.status(statusCodes.NOT_FOUND).json({success:false,message:"Unauthorised!!, Try Logging in!!"});
        }
        const user=await User.findById(userId);
        const {productId}=req.body;

        if(!user){
            return res.status(statusCodes.NOT_FOUND).json({success:false,message:"User not found, Try Logging in!!"});
        }

        const cart= await Cart.findOne({user:userId,"items.product":productId})
        if(cart){
            return res.status(406).json({success:false,message:"Product already available in cart"});
        }

        let wishlist= await Wishlist.findOne({userId}); 

        if(!wishlist){
            wishlist= new Wishlist({
                userId:user._id,
                products:[{productId,addedOn:Date.now()}],
            })
        }

        
        const productIndex = wishlist.products.findIndex(product => product.productId.toString() === productId);
        if (productIndex !== -1) {
            // Remove the product if it exists
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();
            return res.status(200).json({ success: true, message: "Product removed from wishlist!" });
        } 

             wishlist.products.push({productId,addedOn:Date.now()});
        
        await wishlist.save();
        return res.status(200).json({ success: true, message: "Product added to wishlist!" });   
    }catch(err){
        console.error("Error adding to wishlist:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
    }

const loadOrderDetails = async (req, res) => {
        try {
            const orderId = req.params.id;
            const userId = req.user.userId;
            
            const user=await User.findById(userId);
            const order=await Order.findOne({_id:orderId,user:userId})
            .populate('items.product').populate('address');

            if (!order) {
                req.flash("error","Order not found!")
                return res.status(400).render("orderDetails", { order:null,user});
            }
    
            res.status(statusCodes.SUCCESS).render("orderDetails", { order, user});
        } catch (error) {
            console.error("Error loading order details:", error);
            res.status(500).render("orderDetails", { order:null, user});;
        }
    };

const loadWallet = async (req, res) => {
        try {
            const userId = req.user.userId;
            const user = await User.findById(userId);
            let wallet = await Wallet.findOne({ userId });
    
            if (!wallet) {
                wallet = new Wallet({ userId,transactions:[]});
               await wallet.save();
            }
            const balance = wallet.calculatedBalance;
            // Fetch transactions with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const transactions = wallet.transactions.slice((page - 1) * limit, page * limit);
    
            res.render('wallet', { user, wallet,balance, transactions, currentPage: page, totalPages: Math.ceil(wallet.transactions.length / limit) });
        } catch (err) {
            console.error(err);
            res.status(500).json(errorMessages.SERVER.SERVER_ERROR);
        }
    };

 const addMoney = async (req, res) => {
        try {
            const userId = req.user.userId;
            const { amount, paymentMethod } = req.body;
    
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(404).json({ error: 'Wallet not found' });
            }
    
            // Simulate payment processing
            const transaction = {
                transactionId: uuidv4(),
                transactionType: 'credit',
                transactionAmount: amount,
                transactionDate: new Date(),
                transactionStatus: 'completed',
                transactionDescription: `Added via ${paymentMethod}`
            };
    
            wallet.transactions.push(transaction);
            await wallet.save();
    
            res.redirect('/profile/wallet');
        } catch (err) {
            console.error(err);
            res.status(500).json(errorMessages.SERVER.SERVER_ERROR);
        }
    };

const downloadInvoice=async(req,res)=>{
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

const submitReview=async(req,res)=>{
    try {
        const { productId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user.userId; // Assuming user is authenticated and user ID is available in req.user

        // Create a new review
        const newReview = new Review({
            product: productId,
            user: userId,
            rating,
            comment:review,
        });

        await newReview.save();

        // Update the product's average rating
        const product = await Product.findById(productId);
        const reviews = await Review.find({ product: productId });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        product.ratings = totalRating / reviews.length;
        await product.save();

        res.status(200).redirect('/profile/my-orders');
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
}



    module.exports={
        loadProfile,
        editProfile,
        verifyEmail,
        verifyOTP,
        updateChanges,
        loadAddress,
        addAddress,
        updateAddress,
        editPage,
        deleteAddress,
        defaultAddress,
        orderList,
        changePassword ,
        addWishlist,
        loadWishlist,
        loadOrderDetails,
        loadWallet,
        addMoney,
        downloadInvoice,
        submitReview 
    }