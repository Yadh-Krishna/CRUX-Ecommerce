const bcrypt=require('bcrypt');
const User=require('../../models/dbuser');

const loadLogin= async(req,res)=>{
    res.render('userLogin');
}

module.exports = {
    loadLogin
}