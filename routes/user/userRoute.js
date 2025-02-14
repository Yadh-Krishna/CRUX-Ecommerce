const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');
const nocache = require('nocache');

const userController=require('../../controller/userController/userDashboard');
const verifyToken=require('../../middleware/userAuth');
const homeRoutes=require('../user/homeRoutes');
const userProductController=require('../../controller/userController/userProductController')


router.get("/login", userController.loadLogin);
router.post("/login",  userController.loginUser);
router.get("/register",  userController.registerPage);
router.post("/register", userController.registerUser);
router.get("/logout",  userController.logoutUser);

router.get('/verify-OTP',userController.verifyOtp);
router.post('/verify-OTP',userController.authenticateOtp)

router.patch('/user/resend-otp',userController.resendOtp);

router.get('/products/:id',userProductController.productDetails);
router.use('/dashboard',verifyToken,homeRoutes);

module.exports = router; 