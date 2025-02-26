const express= require('express');
const router= express.Router();         
const bcrypt=require('bcrypt');
const nocache = require('nocache');

const userAuthenticate=require('../../middleware/authenticateUser')

const userController=require('../../controller/userController/userDashboard');
const manageUser=require('../../controller/userController/manageUser')
const verifyToken=require('../../middleware/userAuth');
const userProductController=require('../../controller/userController/userProductController')
const cartController=require('../../controller/userController/cartController')
//Login
router.use(userAuthenticate.blockCheck);
router.get("/login",verifyToken, userController.loadLogin);
router.post("/login",  userController.loginUser);
router.get("/register",verifyToken, userController.registerPage);
router.post("/register", userController.registerUser);
router.get("/logout",  userController.logoutUser);
router.get('/verify-OTP', verifyToken, userController.verifyOtp);
router.post('/verify-OTP',userController.authenticateOtp);
router.patch('/resend-otp',userController.resendOtp);
// router.get('/forgot-password',userController.forgotPassword);        
router.patch("/forgot-password",userController.resetPassVerify);
router.patch("/verify-otp",userController.resetPassOtp);
router.patch("/reset-password",userController.resetPassword);


//Product 
// router.get('/dashboard',userAuthenticate,userProductController.loadHome);//home page

router.get('/products/:id',userAuthenticate.authenticateUser,userProductController.productDetails);//product details
router.get('/product-list',userAuthenticate.authenticateUser,userProductController.productList);//product listing
router.get('/',userAuthenticate.authenticateUser,userProductController.loadHome);//home page

router.get('/profile',userAuthenticate.isAuthenticated,manageUser.loadProfile);
router.get('/profile/edit',userAuthenticate.isAuthenticated,manageUser.editProfile);
router.get('/email-verify',userAuthenticate.isAuthenticated,manageUser.verifyEmail);

//Cart 
router.get('/cart',userAuthenticate.isAuthenticated,cartController.loadCart);
router.post('/cart/add',userAuthenticate.isAuthenticated,cartController.addToCart);  
router.put('/cart/update',userAuthenticate.isAuthenticated,cartController.updateCart);

router.patch('/remove-product/:id',userAuthenticate.isAuthenticated,cartController.removeProduct)


module.exports = router; 