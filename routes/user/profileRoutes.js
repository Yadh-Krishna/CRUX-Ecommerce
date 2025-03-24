const express= require('express');
const router= express.Router();         
const bcrypt=require('bcrypt');
const nocache = require('nocache');
const Wishlist=require('../../models/wishlistModel');

const userAuthenticate=require('../../middleware/authenticateUser');
const upload=require('../../middleware/upload')
const userController=require('../../controller/userController/userDashboard');
const manageUser=require('../../controller/userController/manageUser');
const verifyToken=require('../../middleware/userAuth');
const guestToken=require('../../middleware/guestUser')
const userProductController=require('../../controller/userController/userProductController');
const cartController=require('../../controller/userController/cartController');
const orderController=require('../../controller/userController/orderController');



//Profile
router.get('/',verifyToken,manageUser.loadProfile);
router.get('/edit',verifyToken,manageUser.editProfile);
router.patch('/email-verify',verifyToken,manageUser.verifyEmail);
router.patch('/verify-otp',verifyToken,manageUser.verifyOTP);
router.put('/edit',verifyToken,upload.single("profileImage"),manageUser.updateChanges);
router.put('/change-password',verifyToken,manageUser.changePassword);

//Addresses
router.get('/addresses',verifyToken,manageUser.loadAddress);
router.post('/addresses',verifyToken,manageUser.addAddress);
router.get('/addresses/:id',verifyToken,manageUser.editPage);
router.put('/addresses/:id',verifyToken,manageUser.updateAddress);  
router.delete('/addresses/:id',verifyToken,manageUser.deleteAddress);
router.patch('/addresses/:id',verifyToken,manageUser.defaultAddress);

//Orders
router.get('/my-orders',verifyToken,manageUser.orderList);
router.get('/my-orders/:id',verifyToken,manageUser.loadOrderDetails);
router.get('/my-orders/:orderId/invoice',verifyToken,manageUser.downloadInvoice)
router.patch('/cancel/:type/:entityId/:orderId',verifyToken,orderController.cancelOrderItem);
router.patch('/return/:type/:entityId/:orderId',verifyToken,orderController.returnOrderItem);
router.post('/order/review/:productId',verifyToken,manageUser.submitReview)

//Wishlist
router.get('/wishlist',verifyToken,manageUser.loadWishlist);
router.post('/wishlist/add',verifyToken,manageUser.addWishlist);

//Wallet
router.get('/wallet',verifyToken,manageUser.loadWallet);
router.post('/wallet',verifyToken,manageUser.addMoney);

module.exports=router;