const express= require('express');
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const session = require("express-session");
const connectDB=require('./config/db'); 
const path=require('path');
const flash = require("connect-flash");
const bcrypt=require('bcryptjs');
const nocache=require('nocache');
const adminRoutes=require('./routes/admin/adminRoute');
const userRoutes=require('./routes/user/userRoute');
const methodOverride = require("method-override");



const app= express();

app.use(nocache());
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
        collectionName: "sessions",
    }),
    cookie: {
        maxAge: 1000 * 60 * 5, // 5 mins
        httpOnly: true, // Prevents XSS attacks
        secure: false, // Set to true in production with HTTPS
    },
    })
  );//session management

  app.use(methodOverride("_method"));

  app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    
    // Set flash message for errors
    req.flash("error", err.message || "Internal Server Error");

    // Redirect back to the previous page or a generic error page
    res.redirect("/admin/error"); // Redirects to the error page
});

  // Initialize flash middleware
  app.use(flash());

  // Middleware to pass flash messages to all views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb"  }));
 

//view engine
app.set('views',[path.join(__dirname,'views/admin'),path.join(__dirname,'views/user')]);
app.set('view engine','ejs');
app.use(express.static('public'));//Static file pointed

// const userRoutes = require("./routes/userRoutes");

// app.use('/user',userRoutes);


app.use('/admin',nocache(),adminRoutes);
app.use('/user',nocache(),userRoutes);

connectDB();
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
