const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const guestUser = async (req, res, next) => {   
    try {
        if (!req.user) {
            if (req.xhr || req.headers.accept.includes("json")) {
                // Stop further execution & send JSON response for API calls
                return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
            } else {
                // Stop further execution & redirect for page requests
                return res.redirect("/login");
            }
        }
        // If user is authenticated, proceed to the next middleware/controller
        next();
    } catch (err) {
        console.error("Error in guestUser middleware:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { guestUser };