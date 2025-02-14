const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');
const verifyToken=require('../../middleware/userAuth');

const userActivities=require('../../controller/userController/userActivities')


router.get('/',verifyToken,userActivities.loadHome);

module.exports=router;