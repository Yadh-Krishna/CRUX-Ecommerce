const mongoose=require('mongoose');
const dotenv=require('dotenv');
const User=require('../models/dbuser')
const bcrypt=require('bcryptjs');

dotenv.config();

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{});
        console.log("MongoDB Connected...");
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}
connectDB();

module.exports=connectDB;