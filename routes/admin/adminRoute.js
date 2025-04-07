const express= require('express');
const router= express.Router();
const bcrypt=require('bcrypt');

const adminDashboard=require('../../controller/adminController/adminDashboard');
const UserManagement=require('../../controller/adminController/userManage');
const categoryManage=require('../../controller/adminController/categoryManage');
const brandManage=require('../../controller/adminController/brandManage');
const productController= require('../../controller/adminController/productController'); 
const orderController= require('../../controller/adminController/orderController');
const couponController=require('../../controller/adminController/couponController');
const walletController=require('../../controller/adminController/walletController')
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
router.get('/dashboard-data',auth,adminDashboard.getDashboardData)
router.get("/logout",adminDashboard.logout);//logging out of admin management

//Sales Report
router.get('/sales-report',auth,adminDashboard.loadSales);
router.get('/sales-report/export-pdf',auth,adminDashboard.pdfExport);
router.get('/sales-report/export-excel',auth,adminDashboard.excelExport);

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
router.patch('/categories/applyOffer/:categoryId',auth,categoryManage.applyOffer);
router.patch('/categories/removeOffer/:categoryId',auth,categoryManage.removeOffer);

//Brand management
router.get('/brands',auth,brandManage.brandList);
router.get('/brands/add',auth,brandManage.addBrandLoad);
router.post('/brands/add',auth,upload.single("image"),brandManage.addBrand);
router.get("/brands/edit/:id", auth,brandManage.editBrandLoad );
router.put("/brands/:id", auth,upload.single("image"),brandManage.editBrand );
router.patch("/brands/:id/toggle-status",auth,brandManage.blockBrand);

//Product Management
router.get('/products',auth,productController.productList);
// router.get("/products/search", productController.liveSearchProducts);
router.get('/products/add',auth,productController.addProductLoad);
router.post('/products/add',auth,upload.array("images",5),productController.addProduct);
router.get('/products/edit/:id',auth,productController.editProduct);
router.put('/products/edit/:id',auth,upload.fields([
    { name: "replacedImages", maxCount: 5 }, 
    { name: "addImages", maxCount: 2 }
  ]),productController.updateProduct);
router.patch('/products/:id/toggle-status',auth,productController.blockProduct);
router.patch('/products/addOffer',auth,productController.addOffer);
router.patch('/products/removeOffer/:id',auth,productController.removeOffer);

//Order Management
router.get('/orders',auth,orderController.orderList);
router.get('/orders/:id',auth,orderController.orderDetails);
router.patch('/orders/:type/update-status/:id',auth,orderController.orderStatusManage);
router.get('/orders/:orderId/invoice',auth,orderController.downloadInvoice)

//Coupon Management
router.get('/coupons/add',auth,couponController.createCoupon);
router.post('/coupons/add',auth,couponController.addCoupon);
router.get('/coupons',auth,couponController.couponList);
router.get('/coupons/edit/:id',auth,couponController.editCouponLoad);
router.put('/coupons/edit/:id',auth,couponController.updateCoupon);
router.patch('/coupons/toggle/:id',auth,couponController.blockCoupon);

//Wallet Management

router.get('/wallet',auth,walletController.loadWalletPage);

module.exports=router;