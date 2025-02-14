const bcrypt=require('bcrypt');
const User=require('../../models/dbuser');
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
require("dotenv").config();

const sendOTP =require('../../utils/sendOTP');       


// Render login page
const loadLogin = (req, res) => {
    if (req.session.userToken) {  // Check if the user token exists in the session
        return res.redirect("user/dashboard");  // Redirect to dashboard
    }
    res.render("userLogin", { error: null });
};

// User Login & JWT Authentication
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("userLogin", { error: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.render("userLogin", { error: "Your account is blocked!" });
        }

        // Generate JWT Token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Store token in HTTP-only Cookie
        res.cookie("userToken", token, { httpOnly: true, secure: false, sameSite: "lax" });
        console.log("Generated Token:", token); // Debugging
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.redirect("/user/dashboard");
    } catch (error) {
        res.render("userLogin", { error: "Server error. Please try again later." });
    }
};

// Render Registration Page
const registerPage = (req, res) => {
    if (req.session.userToken) {  // Check if the user token exists in the session
        return res.redirect("/user/dashboard");  // Redirect to dashboard
    }
    res.render("register", { error: null });
};

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.render("register", { error: "Email already exists!" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 60000; // OTP expires in 1 minute

        // Store user details temporarily in cookies (encrypted)
        res.cookie("tempUser", JSON.stringify({ name, email, mobile, password: hashedPassword, otp, otpExpires }), {
            httpOnly: true, // Prevent client-side access to cookies
            secure: false, 
            maxAge: 60000 // Expire in 1 minutes
        });

        // Send OTP via email
        await sendOTP(email, otp);

        // Redirect to OTP verification page
        res.redirect("/user/verify-otp");
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.render("register", { error: "Server error. Try again later!" });
    }
};

const verifyOtp= async (req,res)=>{
    if (req.session.userToken) {  // Check if the user token exists in the session
        return res.redirect("/admin/dashboard");  // Redirect to dashboard
    }
    res.render('verify-OTP',{error:null});
}

const authenticateOtp =  async (req, res) => {
    try {
        const { otp } = req.body;

        // Retrieve temp user data from cookies
        const tempUser = req.cookies.tempUser ? JSON.parse(req.cookies.tempUser) : null;

        if (!tempUser) {
            return res.redirect("/user/register");
        }

        const { name, email, mobile, password, otp: storedOTP, otpExpires } = tempUser;

        // Validate OTP
        if (otp !== storedOTP || otpExpires < Date.now()) {
            return res.render("verifyOtp", { error: "Invalid or expired OTP!" });
        }

        // Save user in the database after successful OTP verification
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

        // Clear temp user cookie after verification
        res.clearCookie("tempUser");

        res.redirect("/user/login");
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        res.render("register", { error: "Server error. Try again later!" });
    }
};

const resendOtp = async(req,res)=>{ 
    try {
        const tempUser=req.cookies.tempUser;

        if(!tempUser)return res.status(400).json({error:"No OTP found, Please Sign in Again"});

        let userData=JSON.parse(tempUser);
        const newOTP= crypto.randomInt(100000,999999).toString();
        const otpExpires = Date.now() + 60 * 1000;

        res.cookie("tempUser", JSON.stringify({ ...userData, otp: newOTP, otpExpires }), {
            httpOnly: true,
            secure: false,
            maxAge:  5 * 60 * 1000, // 5 minute
        });
        await sendOTP(userData.email, newOTP);

        return res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ error: "Server error. Please try again." });
    }
}


// Logout User (Clear Cookie)
const logoutUser = (req, res) => {
    res.clearCookie("userToken");
    res.redirect("/user/login");
};

module.exports = {
    loadLogin,
    loginUser,
    registerPage,
    registerUser,
    logoutUser,
    verifyOtp,
    authenticateOtp,
    resendOtp
};
