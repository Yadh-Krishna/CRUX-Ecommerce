const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages');
const crypto = require("crypto");
require("dotenv").config();
const Wishlist=require('../../models/wishlistModel');
const Referral=require('../../models/referralModel')
const sendOTP =require('../../utils/sendOTP'); 
const Product=require('../../models/productModel')
const Cart=require('../../models/cartModel');
const nodemailer=require('nodemailer');
function generateReferralCode() {
    return crypto.randomBytes(6).toString('hex'); // 12 characters long unique code
}

const loadReferrals= async(req,res)=>{
    try{
        const user=req.user.userId;
        const loggedInUser= await User.findById(user);
        let referral=await Referral.findOne({userId:user}).populate('referredUsers');
        if(!referral){
            referral=new Referral({userId:user,referralCode:generateReferralCode()})
            await referral.save();
        }

        res.status(statusCodes.SUCCESS).render('referrals',{referral,user:loggedInUser});

    }catch(err){
        console.error("Error while loading referrals",err);
        req.flash('error','Error while loading Referrals');
        res.status(statusCodes.INTERNAL_SERVER_ERROR).redirect('/profile');
    }
}

const sendReferralInvite= async(req,res)=>{
    try{
        const user=req.user.userId;
        const loggedInUser= await User.findById(user);
        const referral=await Referral.findOne({userId:user}).populate('referredUsers');
        const {inviteEmail}=req.body;
        // console.log("Invite Email",inviteEmail);
        const users=await User.findOne({email:inviteEmail});
        if(users){
            return res.status(statusCodes.CONFLICT).json({success:false,message:'Email already available'});
        }

        const transporter = nodemailer.createTransport({
            service: 'Gmail',  // Use your email service (e.g., Gmail, SendGrid, etc.)
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail ID
                pass: process.env.EMAIL_PASS  // Your Gmail App Password
            },
        });

        const registrationUrl = `http://localhost:5000/register?referralCode=${referral.referralCode}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,  // Sender address
            to: inviteEmail,                     // Recipient address (user's email)
            subject: 'Welcome to Our Platform',  // Email subject
            html: `
                <p>Hi,</p>
                <p>Thank you for registering on our platform. To complete your registration, click the link below:</p>
                <p><a href="${registrationUrl}">Complete Your Registration</a></p>
                <p>Your referral code: <strong>${referral.referralCode}</strong></p>
                <p>Best regards,<br>Your Platform Team</p>
            `,  // Email body with HTML formatting
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({success:false,message:'Internal Server Error'});
            }
            
            return res.status(statusCodes.SUCCESS).json({success:true,message:'Invitation mail sent successfully'});
        });

    }catch(err){

    }
}

module.exports={
    loadReferrals,
    sendReferralInvite
}