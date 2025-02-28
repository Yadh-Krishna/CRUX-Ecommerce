const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
require("dotenv").config();

const Address= require('../../models/addressModal');

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

const loadAddress=async(req,res)=>{
    try{
        const user=await User.findById(req.user.userId);
        if(!user){
            req.flash("error","User not found");
            res.render('profile',{user:null});
        }
        const addresses= await Address.find({user:user._id});
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
        const address=await Address.findByIdAndDelete(id);
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




module.exports={
    loadProfile,
    editProfile,
    verifyEmail,
    loadAddress,
    addAddress,
    updateAddress,
    editPage,
    deleteAddress,
    defaultAddress    
}