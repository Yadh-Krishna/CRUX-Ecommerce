const mongoose=require('mongoose');
const dotenv=require('dotenv');
const User=require('../models/userModel')
const bcrypt=require('bcryptjs');
const Order=require('../models/orderModal')
const Product=require('../models/productModel')
const Category=require('../models/categoryModal');

dotenv.config();

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{});       
     }catch(err){
        console.log(err);
        process.exit(1);
    }
}

connectDB();

module.exports=connectDB;