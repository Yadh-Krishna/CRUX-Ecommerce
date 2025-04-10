const express= require('express');
const router= express.Router();         
const bcrypt=require('bcrypt');
const nocache = require('nocache');
const upload=require('../../middleware/upload')
const userAuthenticate=require('../../middleware/authenticateUser')
const jwt=require('jsonwebtoken')
const userController=require('../../controller/userController/userDashboard');
const manageUser=require('../../controller/userController/manageUser')
const verifyToken=require('../../middleware/userAuth');
const userProductController=require('../../controller/userController/userProductController')
const cartController=require('../../controller/userController/cartController')
const checkoutController=require('../../controller/userController/checkoutController')
const profileRoutes=require('./profileRoutes');

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
router.get('/products/:id',userAuthenticate.authenticateUser,userProductController.productDetails);//product details
router.get('/product-list',userAuthenticate.authenticateUser,userProductController.productList);//product listing
router.get('/',userAuthenticate.authenticateUser,userProductController.loadHome);//home page

router.get("/auth/status", async(req, res) => {
    try {
    const token = req.cookies.userToken;
    if (!token) {
      return res.json({ loggedIn: false });
    }      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   console.log("decoded ",decoded);
      res.json({ loggedIn: true, userId: decoded.userId, email: decoded.email });
    } catch (err) {
      res.json({ loggedIn: false });
    }
  });

router.use(userAuthenticate.isAuthenticated);

router.use('/profile',profileRoutes)

//Cart 
router.get('/cart',verifyToken,cartController.loadCart);
router.post('/cart/add',verifyToken,cartController.addToCart);  
router.put('/cart/update',verifyToken,cartController.updateCart);
router.patch('/remove-product/:id',verifyToken,cartController.removeProduct);

//Checkout
router.get('/checkout',verifyToken,checkoutController.loadCheckout);
router.get('/order',verifyToken,checkoutController.loadOrder);

router.patch('/apply-coupon',verifyToken,checkoutController.applyCoupon);
router.patch('/remove-coupon',verifyToken,checkoutController.removeCoupon);

router.post('/order',verifyToken,checkoutController.placeOrder);
router.post('/order/create-razorpay-order',verifyToken,checkoutController.createRazorPay);
router.post('/order/verify-payment',verifyToken,checkoutController.verifyOnlinePayment);
router.get('/order/get-order-info/:orderId', verifyToken, checkoutController.getOrderInfo);
router.post('/order/cancel-failed-order', verifyToken, checkoutController.cancelFailedOrder);
router.patch('/order/retry-payment',verifyToken,checkoutController.retryPayment)
router.get('/payment-retry',verifyToken,checkoutController.loadRetry);


router.get('*',userProductController.errorPage);
module.exports = router; 