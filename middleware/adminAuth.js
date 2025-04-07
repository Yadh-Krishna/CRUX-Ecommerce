const jwt = require("jsonwebtoken");

const verifyAdminToken = (req, res, next) => {
    const token = req.cookies.adminToken;

    if (!token) {
        return res.redirect("/admin/login"); // Redirect if no token
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = verified;  // Attach admin data to request

        
        next();
    } catch (error) {
        res.clearCookie("adminToken");
        res.redirect("/admin/login"); // Redirect if token is invalid/expired
    }
};

module.exports = verifyAdminToken;


