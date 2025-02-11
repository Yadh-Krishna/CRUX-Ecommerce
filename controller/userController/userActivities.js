const bcrypt=require('bcrypt');
const User=require('../../models/dbuser');
const jwt = require("jsonwebtoken");


require("dotenv").config();

const loadHome=async(req,res)=>{
    res.render('homePage');
}

module.exports={
    loadHome
}