const bcrypt=require('bcrypt');
const Admin=require('../../models/dbadmin');
const jwt = require("jsonwebtoken");

const loadLogin = (req, res) => {
    const token = req.cookies.adminToken; // Read token from cookies

    if (token) {
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect("/admin/dashboard"); // Redirect if admin is already logged in
        } catch (error) {
            res.clearCookie("adminToken"); // Clear invalid token
        }
    }

    res.render("admin-login", { error: null }); // Render login page if not authenticated
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.render("admin-login", { error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ adminId: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Store token in HTTP-only Cookie
        res.cookie("adminToken", token, {
            httpOnly: true,    // Prevents JavaScript access (security best practice)
            secure: process.env.NODE_ENV === "development", 
            sameSite: "strict", // Protect against CSRF
            maxAge: 1 * 60 * 60 * 1000 // Token expires in 1 hour
        });

        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error("Login error:", error);
        res.render("admin-login", { error: "Server error. Please try again later." });
    }
};

const loadDashboard = (req, res) => {
    const token = req.cookies.adminToken; // Read token from cookies

    if (!token) {
        return res.redirect("/admin/login"); // Redirect if no token
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; // Attach admin data for use in the template
        
        res.render("dashboard", { products: [] }); // Pass admin data to view
    } catch (error) {
        res.clearCookie("adminToken"); // Clear invalid token
        return res.redirect("/admin/login"); // Redirect to login
    }
};

const logout = (req, res) => {
    res.clearCookie("adminToken"); // Remove the token from cookies
    res.redirect("/admin/login"); // Redirect to login page
};

module.exports={
    loadLogin,
    login,
    loadDashboard,
    logout,  
}
