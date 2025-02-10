const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');
const userController=require('../../controller/userController/userDashboard');


router.get('/login',userController.loadLogin);

module.exports = router; 