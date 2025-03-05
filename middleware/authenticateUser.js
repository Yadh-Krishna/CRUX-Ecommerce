    const jwt = require("jsonwebtoken");
    const User = require("../models/userModel");

    /**
     * Middleware to check if the user is authenticated.
     * Used for public pages where login is optional.
     */
    const authenticateUser = async (req, res, next) => {
        try {
            const token = req.cookies.userToken;

            if (!token) {
                req.user = null; // No token, user is a guest
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                req.user = null;
                return next();
            }

            req.user = user; // Attach user to request
            next();
        } catch (error) {
            console.error("Authentication Error:", error.message);
            req.user = null;
            next();
        }
    };

    /**
     * Middleware to block users who are inactive.
     * Applied globally to check if the user is blocked before any route.
     */
    const blockCheck = async (req, res, next) => {
        try {
            const token = req.cookies.userToken;

            if (!token) {
                req.user = null; // No token, user not logged in
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                req.user = null; // Invalid user
                return next();
            }

            if (!user.isActive) {
                res.clearCookie("userToken");
                req.flash("error", "Your account has been blocked.");
                return res.redirect("/login");
            }

            req.user = user;    
            next();
        } catch (err) {
            // console.error("BlockCheck Error:", err.message);
            res.clearCookie("userToken");
            req.flash("error", "Session expired. Please log in again.");
            return res.redirect("/login");
        }
    };

    const isAuthenticated = (req, res, next) => {    
        if (!req.user) {                
            if (req.xhr || req.headers.accept.includes("json")) {                
               
                return res.status(401).json({ success: false, message: "Please log in to continue." });
            }   
            return res.redirect("/login"); // Redirect guest users to login
        }
        next(); // Allow authenticated users to proceed
    };


    module.exports = {
        authenticateUser,
        blockCheck,
        isAuthenticated
    };


