const bcrypt=require('bcrypt');
const User=require('../../models/dbuser');
const jwt = require("jsonwebtoken");
require("dotenv").config();



// Render login page
const loadLogin = (req, res) => {
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
        res.cookie("userToken", token, { httpOnly: true, secure: process.env.NODE_ENV === "development", sameSite: "strict" });
        console.log("Generated Token:", token); // Debugging
        res.render("HomePage");
    } catch (error) {
        res.render("userLogin", { error: "Server error. Please try again later." });
    }
};

// Render Registration Page
const registerPage = (req, res) => {
    res.render("register", { error: null });
};

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;
        console.log(req.body);
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("userLogin", { error: "Email already exists. Try logging in!" });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
       
        // Create user
        const newUser = new User({
            fullName:name,
            email,
            mobile,
            password: hashedPassword,
            isVerified: true, // Set to true for now, implement OTP verification later
        });

        await newUser.save();
        res.redirect("/user/login");
    } catch (error) {
        res.render("register", { error: "Server error. Please try again later." });
    }
};

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
    logoutUser
};
