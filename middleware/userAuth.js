const jwt = require("jsonwebtoken");    
const errorMessages=require('../utils/errorMessages');
const statusCodes=require('../utils/statusCodes')

const verifyToken=(req, res, next) => {
    const token = req.cookies.userToken;
    if (!token) return res.status(statusCodes.UNAUTHORIZED).render('userLogin',{ error: errorMessages.USER.UNAUTHORIZED });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attach user data to request
        next();
    } catch (error) {
        res.status(statusCodes.BAD_REQUEST).render('userLogin',{ error: errorMessages.AUTH.NO_TOKEN });
    }
};


module.exports = verifyToken;

