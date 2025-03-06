const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');

const adminDashboard=require('../../controller/adminController/adminDashboard');
const UserManagement=require('../../controller/adminController/userManage');
const categoryManage=require('../../controller/adminController/categoryManage');
const brandManage=require('../../controller/adminController/brandManage');
const productController= require('../../controller/adminController/productController'); 
const orderController= require('../../controller/adminController/orderController');
const auth = require("../../middleware/adminAuth");
const User = require("../../models/userModel");

const Category = require("../../models/categoryModal");
const upload = require("../../middleware/upload");  //multer
const Brands = require("../../models/brandModel"); //Brands model
const Product=require("../../models/productModel");//products model

//Login
router.get('/login',adminDashboard.loadLogin);//Loading Login page
router.post('/login',adminDashboard.login);//providing creds

//Dashboard
router.get('/dashboard',auth,adminDashboard.loadDashboard);//Loading dashboard
router.get("/logout",adminDashboard.logout);//logging out of admin management

//user Management
router.get("/users",auth, UserManagement.loadUsers);  //Customer User page  
router.get("/users/search", UserManagement.liveSearchUsers);
router.patch("/users/delete/:id",auth, UserManagement.blockUser);// Toggle user status (Block/Unblock)

//Error Handling
router.get('/error',auth,(req,res)=>{
    res.render('404-error');
})

//Category management
router.get('/categories',auth,categoryManage.categoryList);
router.get('/categories/add',auth,categoryManage.addCategoryLoad);
router.post('/categories/add',auth,upload.single("image"), categoryManage.addCategory);
router.get("/categories/edit/:id",auth,categoryManage.editCategoryLoad );
router.put("/categories/:id", upload.single("image"),categoryManage.editCategory );
router.patch("/categories/:id/toggle-status",auth,categoryManage.blockCategory);  

//Brand management
router.get('/brands',auth,brandManage.brandList);
router.get('/brands/add',auth,brandManage.addBrandLoad);
router.post('/brands/add',auth,upload.single("image"),brandManage.addBrand);
router.get("/brands/edit/:id", auth,brandManage.editBrandLoad );
router.put("/brands/:id", auth,upload.single("image"),brandManage.editBrand );
router.patch("/brands/:id/toggle-status",auth,brandManage.blockBrand);

//Product Management
router.get('/products',auth,productController.productList);
router.get("/products/search", productController.liveSearchProducts);
router.get('/products/add',auth,productController.addProductLoad);
router.post('/products/add',auth,upload.array("images",5),productController.addProduct);
router.get('/products/edit/:id',auth,productController.editProduct);
router.put('/products/edit/:id',auth,upload.fields([
    { name: "replacedImages", maxCount: 5 }, 
    { name: "addImages", maxCount: 2 }
  ]),productController.updateProduct);
router.patch('/products/:id/toggle-status',auth,productController.blockProduct);

//Order Management
router.get('/orders',auth,orderController.orderList);
router.get('/orders/:id',auth,orderController.orderDetails);

module.exports=router;