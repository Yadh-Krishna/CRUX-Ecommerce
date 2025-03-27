const Category=require('../../models/categoryModal');
const Offer=require('../../models/offerModel')
const Coupon=require('../../models/couponModel')
const asyncHandler=require('express-async-handler');
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const createCoupon=async(req,res)=>{
    res.render('createCoupon');
}

const addCoupon=async(req,res)=>{
    try{
        const {name,offerPrice,minimumPrice,startDate,expireOn}=req.body;        
        let coupon= await Coupon.findOne({name});                
        if(!coupon){
            const expire = new Date(expireOn);
            expire.setHours(23, 59, 59, 999); // Set to end of day
         coupon= new Coupon({
            name,
            startDate:new Date(startDate),
            expireOn:expire,
            offerPrice,
            minimumPrice
        })
        await coupon.save();
        req.flash("success","Coupon added Successfully");
       return res.redirect('/admin/coupons');
    }

    req.flash("error","Coupon already exists");
    return res.redirect('/admin/coupons');         
        
    }catch(err){
        console.log(err);
        req.flash("error","Something Went Wrong!!");
        return res.redirect('/admin/coupons')
    }
}

const couponList=async(req,res)=>{
    try{
        const coupon=await Coupon.find();
        return res.render('coupon',{coupons:coupon,totalPages:null,currentPage:null,limit:null});
    }catch(err){
        console.error(err);
    }
}

const editCouponLoad= async(req, res)=>{
    try{    
        const id=req.params.id;
        const coupon=await Coupon.findById(id);
        if(!coupon){
            req.flash("error","Coupon not found");
            return res.status(statusCodes.NOT_FOUND).redirect('/admin/coupons');
            }
            return res.status(statusCodes.SUCCESS).render('editCoupon',{coupon:coupon});
       }catch(err){
        console.error(err);
        req.flash("error", "Server Error");
        res.redirect('/admin/coupons');
    }
}

const updateCoupon=async(req,res)=>{
    try{
        const {name,offerPrice,startDate,expireOn,minimumPrice}=req.body;
        const id=req.params.id;
        let coupon=await Coupon.findById(id);
        if(!coupon){
        return res.status(statusCodes.NOT_FOUND).json({success:false,message:"Coupon not found"});
        }
        const expire = new Date(expireOn);
        expire.setHours(23, 59, 59, 999); // Set to end of day
        coupon=await Coupon.findByIdAndUpdate(id,{name,offerPrice,startDate:new Date(startDate),expireOn:expire,minimumPrice});
       
        return res.status(statusCodes.SUCCESS).json({success:true,message:"Coupon updated successfully"})
    }catch(err){
        console.error(err);       
        return res.status(statusCodes.SERVER_ERROR).json({success:false,message:"Internal server error!!"})
    }
}   

const blockCoupon=async(req,res)=>{
    try{
        const id=req.params.id;
        const coupon=await Coupon.findById(id);
        if(!coupon){
            return res.status(statusCodes.NOT_FOUND).json({success:false,message:"Coupon not found"});
        }
        coupon.isActive=!coupon.isActive;
        await coupon.save();
        return res.status(statusCodes.SUCCESS).json({success:true});


    }catch(err){
        console.error(err);
        return res.status(statusCodes.SERVER_ERROR).json({success:false,message:errorMessages.SERVER.SERVER_ERROR});
    }
}

    module.exports={
    couponList, 
    createCoupon,
    addCoupon,
    editCouponLoad,
    updateCoupon,
    blockCoupon
    }