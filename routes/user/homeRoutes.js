const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');

const userActivities=require('../../controller/userController/userActivities')


router.get('/',userActivities.loadHome);

module.exports=router;