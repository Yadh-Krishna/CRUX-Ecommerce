const bcrypt = require("bcrypt");
const Admin = require("../../models/adminModal");
const jwt = require("jsonwebtoken");
const statusCodes = require("../../utils/statusCodes");
const errorMessages = require("../../utils/errorMessages");
const Wishlist = require("../../models/wishlistModel");
const Order = require("../../models/orderModal");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartModel");
const Wallet = require("../../models/walletModel");
const Coupon = require("../../models/couponModel");
const moment = require("moment");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// const loadWalletPage = async (req, res) => {
//   try {
//     const admin = req.admin;   
//     if (!admin) {
//       req.flash("error", "Unauthorized");
//       return res.status(400).redirect("/");
//     }

//     let wallet = await Wallet.findOne({ userId: admin.adminId })
//       .populate({
//         path: "transactions.orderId",
//         populate: {
//           path: "user",
//           model: "users", 
//         },
//       })
//       .populate("userId");

//     if (!wallet) {
//       wallet = new Wallet({
//         userId: admin.adminId,
//         transactions: [],
//       });
//       await wallet.save();
//     }
//     wallet.transactions.sort((a, b) => b.transactionDate - a.transactionDate);
//     wallet.totalCredited = wallet.transactions.reduce(
//       (acc, curr) =>
//         acc + (curr.transactionType === "credit" ? curr.transactionAmount : 0),
//       0
//     );
//     wallet.totalDebited = wallet.transactions.reduce(
//       (acc, curr) =>
//         acc + (curr.transactionType === "debit" ? curr.transactionAmount : 0),
//       0
//     );   
//     return res.render("adminWallet", { wallet });
//   } catch (err) {
//     console.error(err);
//     req.flash("error", "Failed to load the Wallet Page");
//     res.redirect("/");
//   }
// };

const loadWalletPage = async (req, res) => {
  try {
    const admin = req.admin;   
    if (!admin) {
      req.flash("error", "Unauthorized");
      return res.status(400).redirect("/");
    }

    let wallet = await Wallet.findOne({ userId: admin.adminId })
      .populate({
        path: "transactions.orderId",
        populate: {
          path: "user",
          model: "users", 
        },
      })
      .populate("userId");

    if (!wallet) {
      wallet = new Wallet({
        userId: admin.adminId,
        transactions: [],
      });
      await wallet.save();
    }

    
    // Sort transactions
    wallet.transactions.sort((a, b) => b.transactionDate - a.transactionDate);

    // Calculate credits & debits
    wallet.totalCredited = wallet.transactions.reduce(
      (acc, curr) => acc + (curr.transactionType === "credit" ? curr.transactionAmount : 0), 0
    );
    wallet.totalDebited = wallet.transactions.reduce(
      (acc, curr) => acc + (curr.transactionType === "debit" ? curr.transactionAmount : 0), 0
    );

   

    // PAGINATION
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of transactions per page
    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedTransactions = wallet.transactions.slice(startIndex, endIndex);

    // Inject paginated transactions into a new object
    const walletData = {
      ...wallet.toObject(),
      transactions: paginatedTransactions
    };

    return res.render("adminWallet", {
      wallet: walletData,
      currentPage: page,
      totalPages,
      credit:wallet.totalCredited,
      debit:wallet.totalDebited
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load the Wallet Page");
    res.redirect("/");
  }
};


const createToken= async(req,res)=>{

const user=req.cookies.token;
const decoded=user.verify(token,process.env.JWT_SECRET,{});




}


module.exports = {
  loadWalletPage,
};
