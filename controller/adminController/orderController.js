const Product=require('../../models/productModel');
const Category=require('../../models/categoryModal');
const Brand=require('../../models/brandModel');  
const asyncHandler = require('express-async-handler');

const upload = require("../../middleware/upload");  //multer 
const fs=require('fs');
const path=require('path');
const sharp=require('sharp');

const orderList=async(req,res)=>{
    res.render('order-lists');
}

module.exports={
    orderList
}