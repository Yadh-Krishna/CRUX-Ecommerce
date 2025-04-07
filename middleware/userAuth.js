
const jwt = require("jsonwebtoken");    
const errorMessages=require('../utils/errorMessages');
const statusCodes=require('../utils/statusCodes');


const verifyToken = (req, res, next) => {
    const token = req.cookies.userToken;     
   
    try {
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Verified : ",verified);
        req.user = verified;     
        // console.log("Verified : ",req.path)            
        if (["/login", "/register", "/verify-OTP"].includes(req.path)) {
            return res.redirect("/");
        }
        next();
    } catch (error) {
        res.clearCookie("userToken"); // Clear invalid token
        next();
    }
};

module.exports = verifyToken;

