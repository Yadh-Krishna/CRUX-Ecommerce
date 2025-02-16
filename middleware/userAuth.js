const jwt = require("jsonwebtoken");    
const errorMessages=require('../utils/errorMessages');
const statusCodes=require('../utils/statusCodes');


const verifyToken = (req, res, next) => {
    const token = req.cookies.userToken;
    // console.log(token);
    
    if (!token) {
        return res.status(statusCodes.UNAUTHORIZED).redirect("/user/login"); // Unauthorized if no token
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Verified : ",verified);
        req.user = verified; // Attach user data to request
        next();
    } catch (error) {
        res.clearCookie("userToken"); // Clear invalid token
        res.status(statusCodes.BAD_REQUEST).redirect("/user/login");
    }
};

module.exports = verifyToken;

