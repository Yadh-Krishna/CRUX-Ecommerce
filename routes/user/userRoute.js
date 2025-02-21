const express= require('express');
const router= express.Router();         
const bcrypt=require('bcrypt');
const nocache = require('nocache');

const userAuthenticate=require('../../middleware/authenticateUser')

const userController=require('../../controller/userController/userDashboard');
const verifyToken=require('../../middleware/userAuth');
const userProductController=require('../../controller/userController/userProductController')

//Login

router.get("/login",verifyToken, userController.loadLogin);
router.post("/login",  userController.loginUser);
router.get("/register",verifyToken, userController.registerPage);
router.post("/register", userController.registerUser);
router.get("/logout",  userController.logoutUser);
router.get('/verify-OTP', verifyToken, userController.verifyOtp);
router.post('/verify-OTP',userController.authenticateOtp);
router.patch('/resend-otp',userController.resendOtp);
router.get('/forgot-password',userController.forgotPassword);
router.patch("/forgot-password",userController.resetPassVerify);
router.patch("/verify-otp",userController.resetPassOtp);
router.patch("/reset-password",userController.resetPassword);


//Product 
// router.get('/dashboard',userAuthenticate,userProductController.loadHome);//home page

router.get('/products/:id',userAuthenticate,userProductController.productDetails);//product details
router.get('/product-list',userAuthenticate,userProductController.productList);//product listing
router.get('/',userAuthenticate,userProductController.loadHome);//home page

router.get('/profile/:id',verifyToken,userController.loadProfile);


module.exports = router; 