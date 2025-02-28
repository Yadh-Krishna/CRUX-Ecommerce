const express= require('express');
const router= express.Router();         
const bcrypt=require('bcrypt');
const nocache = require('nocache');

const userAuthenticate=require('../../middleware/authenticateUser');

const userController=require('../../controller/userController/userDashboard');
const manageUser=require('../../controller/userController/manageUser');
const verifyToken=require('../../middleware/userAuth');
const userProductController=require('../../controller/userController/userProductController');
const cartController=require('../../controller/userController/cartController');


//Profile
router.get('/',verifyToken,manageUser.loadProfile);
router.get('/edit',verifyToken,manageUser.editProfile);
router.get('/email-verify',verifyToken,manageUser.verifyEmail);

//Addresses
router.get('/addresses',verifyToken,manageUser.loadAddress);
router.post('/addresses',verifyToken,manageUser.addAddress);
router.get('/addresses/:id',verifyToken,manageUser.editPage);
router.put('/addresses/:id',verifyToken,manageUser.updateAddress);  
router.delete('/addresses/:id',verifyToken,manageUser.deleteAddress)
router.patch('/addresses/:id',verifyToken,manageUser.defaultAddress)

module.exports=router;