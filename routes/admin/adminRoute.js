const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');

const adminDashboard=require('../../controller/adminController/adminDashboard');
const UserManagement=require('../../controller/adminController/userManage');
const categoryManage=require('../../controller/adminController/categoryManage')

const auth = require("../../middleware/adminAuth");
const User = require("../../models/dbuser");

const Category = require("../../models/dbcategory");
const upload = require("../../middleware/upload");  

//Login
router.get('/login',adminDashboard.loadLogin);//Loading Login page
router.post('/login',adminDashboard.login);//providing creds

//Dashboard
router.get('/dashboard',auth,adminDashboard.loadDashboard);//Loading dashboard
router.get("/logout",adminDashboard.logout);//logging out of admin management

//user Management
router.get("/users",auth, UserManagement.loadUsers);  //Customer/User page  
router.patch("/users/toggle-status/:id", UserManagement.blockUser);// Toggle user status (Block/Unblock)
router.get("/users/search", UserManagement.fetchSearch);//fetch Search users

//Category management
router.get('/categories',auth,categoryManage.categoryList);
router.post('/categories/add', upload.single("image"), categoryManage.addCategory);
router.put("/categories/:id", upload.single("image"),categoryManage.editCategory );
router.patch("/categories/:id/toggle-status", categoryManage.blockCategory);  
router.get('/categories',categoryManage.searchCategory);



module.exports=router;