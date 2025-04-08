const bcrypt=require('bcrypt');
const User=require('../../models/userModel');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages')
const crypto = require("crypto");
const Referral=require('../../models/referralModel')
const Coupon=require('../../models/couponModel')
require("dotenv").config();
const generateCouponCode = () => {
    return "REF" + Math.random().toString(36).substr(2, 8).toUpperCase();
};

const sendOTP =require('../../utils/sendOTP');       


// Render login page
const loadLogin = (req, res) => {    
    
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private"); 
    res.render("userLogin", { error: null });
};

// User Login & JWT Authentication
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash("error","Invalid email or password");
            return res.redirect("/login");
        }

        if (!user.isActive) {
            req.flash("error","User is blocked");
            return res.redirect('/login');
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
       
        // Store token in HTTP-only Cookie
        res.cookie("userToken", token, { httpOnly: true, secure: false, sameSite: "lax" });
        
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.redirect("/");
    } catch (error) {
        res.render("userLogin", { error: "Server error. Please try again later." });
    }
};

// Render Registration Page
const registerPage = (req, res) => {
    
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.render("register", { error: null });
};

// Register User
const registerUser = async (req, res) => {
    try {
        // console.log("Register route hit"); 
        const { name, email, mobile, password ,referralCode} = req.body;
        // console.log("Referral ", referralCode);
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            req.flash('error','Email already exists!')
            return res.redirect("/register");
        }
        if(referralCode){
            
        //  console.log("Referral Code Provided:", referralCode);

        const referral= await Referral.findOne({referralCode:referralCode});
        if (!referral) {
            req.flash("error", "Referral code not valid");
            return res.redirect("/register");
        }
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 60000; // OTP expires in 1 minute
        console.log(otp);
        // Store user details temporarily in cookies (encrypted)
        res.cookie("tempUser", JSON.stringify({ name, email, mobile,referralCode, password: hashedPassword, otp, otpExpires }), {
            httpOnly: true, // Prevent client-side access to cookies
            secure: false, 
            maxAge: 5 * 60000 // Expire in 5 minutes
        });

        // Send OTP via email
        await sendOTP(email, otp,"signup");
        // console.log("Redirecting to /verify-otp");
        res.cookie("otpStart", true, {
            httpOnly: false,
            maxAge: 5 * 60000
        });
        res.redirect("/verify-OTP");
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.render("register", { error: "Server error. Try again later!" });
    }
};

const verifyOtp= async (req,res)=>{
    
    res.render('verify-OTP',{error:null});
}

const authenticateOtp =  async (req, res) => {
    try {
        const { otp } = req.body;        
        const tempUser = req.cookies.tempUser ? JSON.parse(req.cookies.tempUser) : null;

        if (!tempUser) {
            req.flash("error", "Session expired. Please register again.");
            return res.redirect("/register");
        }

        const { name, email, mobile, password, otp: storedOTP, otpExpires,referralCode } = tempUser;
        // console.log("Referral ",referralCode);
       
        if (otp !== storedOTP || otpExpires < Date.now()) {
            req.flash("error", "Invalid or expired OTP!");
            return res.redirect("/verify-OTP");
        }

        
        const newUser = new User({
            fullName: name,
            email,
            mobile,
            password,
            otp,
            otpExpires,
            isVerified: true
        });
        await newUser.save();

        // const referral= await Referral.findOne({referralCode}).populate('userId');
        // if(referral){          
        //     if(referree){
        //         referree.referredUsers.push(newUser._id);    
        //         await referree.save();           
        //     }    
        // }
        // console.log(" Outside referrral code command",referralCode);
        if (referralCode) {
            console.log(" Inside referrral code command",referralCode);
            const referral = await Referral.findOne({ referralCode }).populate("userId");

            if (referral && referral.userId) {
                referral.referredUsers.push(newUser._id);
                await referral.save();

                // Generate referral coupon
                // const couponCode = ;
                const referralCoupon = new Coupon({
                    name: "Referral Bonus",
                    code: generateCouponCode(),
                    startDate: new Date(),
                    expireOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 days expiry
                    offerPrice: 20, 
                    minimumPrice: 500, 
                    maximumDiscount: 100,
                    isActive: true,
                    rewardUsers: [newUser._id, referral.userId._id], 
                    generatedByReferral: true
                });

                await referralCoupon.save();
            }
        }

        // Clear temp user cookie after verification
        res.clearCookie("tempUser");
        
        req.flash("success","User Added Successfully, Try Logging In !!");
        res.redirect("/login");
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        req.flash("error", "Server error. Try again later!");
        res.redirect("/register");
    }
};

const forgotPassword=async (req,res)=>{
    res.render('forgotPassword');
}
const resendOtp = async(req,res)=>{ 
    try {
        
        const tempUser = req.cookies.tempUser ? JSON.parse(req.cookies.tempUser) : null;
        // console.log(tempUser);

        if (!tempUser) {
            res.clearCookie("tempUser"); // Ensure expired cookie is removed
            return res.status(400).json({ error: "Session expired. Please register again." });
        }

        const { name, email, mobile, password } = tempUser;

        // Generate a new 6-digit OTP
        const newOtp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 60000; // OTP expires in 1 minute
        console.log(newOtp);

        console.log("Resent OTP:", newOtp); // Debugging

        // Update temp user details in cookies
        res.cookie("tempUser", JSON.stringify({ name, email, mobile, password, otp: newOtp, otpExpires }), {
            httpOnly: true,
            secure: false, // Use secure cookies in production
            sameSite: "lax",
            maxAge: 70000 // Slightly longer than OTP expiry (1m 10s)
        });

        // Send new OTP via email
        await sendOTP(email, newOtp,"signup");

        return res.status(200).json({ message: "A new OTP has been sent to your email." });
    } catch (error) {
        console.error("Error in resendOtp:", error);
        return res.status(500).json({ error: "Server error. Try again later!" });
    }
}

const resetPassVerify=async(req,res)=>{
    try {
        const { forgotEmail } = req.body;
       
        // Check if user exists
        const user = await User.findOne({ email:forgotEmail });
        if (!user) return res.status(400).json({ error: "User not found" });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 60 * 1000; // Expires in 1 min
        console.log('OTP for reset password : ',otp);
        // Store OTP
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP using the updated sendOTP function
        await sendOTP(forgotEmail, otp, "reset-password");

        res.json({ success: true, message: "OTP sent for password reset" });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const resetPassOtp=async (req, res) => {
    try {
        const { forgotEmail, otp } = req.body;

        const user = await User.findOne({ email:forgotEmail });
        if (!user) return res.status(400).json({ error: "User not found" });

        // Check OTP validity
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // OTP verified, reset OTP fields
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ success: true, message: "OTP Verified!" });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        // Hash new password
        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Logout User (Clear Cookie)
const logoutUser = (req, res) => {
    res.clearCookie("userToken");
    res.redirect("/login");
};

module.exports = {
    loadLogin,
    loginUser,
    registerPage,
    registerUser,
    logoutUser,
    verifyOtp,
    authenticateOtp,
    resendOtp,
    forgotPassword,
    resetPassVerify,
    resetPassOtp,
    resetPassword,
    
};
