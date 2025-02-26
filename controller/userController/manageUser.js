const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
require("dotenv").config();

const sendOTP =require('../../utils/sendOTP'); 

const loadProfile=async(req,res)=>{
    try{
        const user= await User.findById(req.user.userId);        
        if(!user){
            req.flash("error", "User not found");
            return res.redirect("/login");
        }
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
        const email=req.body;
        const user=await User.findOne({email});
        if(!user){
            req.flash("error","Email not found");
           return res.status(statusCodes.NOT_FOUND).json(errorMessages.USER.NOT_FOUND);
        }
        if(!user.isActive){
            req.flash("error","User is Blocked");
        return res.status(statusCodes.NOT_FOUND).json(errorMessages.USER.BLOCKED);     
      }
      
      const otp= crypto.randomInt(100000,999999);
      const otpExpires= Date.now()+60000; // Otp valid for 1 minute

      user.otp= otp;
      user.otpExpires= otpExpires;  
      await user.save();

      await sendOTP(email,otp,"verify-email");

      return res.status(statusCodes.SUCCESS).json({ message: "OTP sent successfully" });

}catch(err){
    console.error("Error Verifying mail : ",err);
    res.json(errorMessages.SERVER.SERVER_ERROR).json({error:"Something Went Wrong!!"})
}
}



module.exports={
    loadProfile,
    editProfile,
    verifyEmail
    
}