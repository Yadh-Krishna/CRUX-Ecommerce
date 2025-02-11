const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');
const nocache = require('nocache');

const userController=require('../../controller/userController/userDashboard');
const verifyToken=require('../../middleware/userAuth');
const homeRoutes=require('../user/homeRoutes');


router.get("/login", nocache(), userController.loadLogin);
router.post("/login", nocache(), userController.loginUser);
router.get("/register", nocache(), userController.registerPage);
router.post("/register", nocache(), userController.registerUser);
router.get("/logout", nocache(), userController.logoutUser);

router.use('/dashboard',verifyToken,homeRoutes);

module.exports = router; 