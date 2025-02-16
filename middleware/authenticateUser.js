const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; // Extract token

        if (!token) {
            req.user = null; // No token, user not logged in
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        const user = await User.findById(decoded.id).select("-password"); // Get user details

        if (!user) {
            req.user = null; // Invalid user
            return next();
        }

        req.user = user; // Attach user to request
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = authenticateUser;