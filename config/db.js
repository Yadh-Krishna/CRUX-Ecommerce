const mongoose=require('mongoose');
const dotenv=require('dotenv');
const User=require('../models/userModel')
const bcrypt=require('bcryptjs');
const Order=require('../models/orderModal')

dotenv.config();

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{});
        console.log("MongoDB Connected...")
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}
connectDB();

module.exports=connectDB;