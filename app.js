const express= require('express');
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const session = require("express-session");
const connectDB=require('./config/db'); 
const path=require('path');
const flash = require("connect-flash");
const bcrypt=require('bcrypt');
const nocache=require('nocache');
const adminRoutes=require('./routes/admin/adminRoute');
const userRoutes=require('./routes/user/userRoute');
const methodOverride = require("method-override");
const dotenv=require('dotenv');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport')
const jwt= require('jsonwebtoken');
const upload=require('./middleware/upload')
const Razorpay=require('razorpay');
const statusCodes=require('./utils/statusCodes')


const googleAuth=require('./controller/authController')

dotenv.config();

const app= express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb"  }));

app.use(nocache());

  app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
          mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
          collectionName: "sessions",
      }),

      })
    );//session management
  
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static('public'));//Static file pointed


  app.use(methodOverride("_method"));
 
  // Initialize flash middleware
  app.use(flash());

  // Middleware to pass flash messages to all views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});
  app.use(cookieParser());
//view engine
app.set('views',[path.join(__dirname,'views/admin'),path.join(__dirname,'views/user')]);
app.set('view engine','ejs');


app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"],session: false }));

app.get("/auth/google/callback",  passport.authenticate("google", { failureRedirect: "/user/login",session: false }),googleAuth);

app.use('/admin',adminRoutes);
app.use('/',userRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err.message);    
  // Set flash message for errors
  req.flash("error", err.message || "Internal Server Error");
  // Redirect back to the previous page or a generic error page
  res.status(statusCodes.SERVER_ERROR).render("500-error"); 
}); 

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_ID,
  key_secret: process.env.RAZOR_PAY_SECRET_KEY,
});


connectDB();
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server Live on URL: http://localhost:${PORT}`));
