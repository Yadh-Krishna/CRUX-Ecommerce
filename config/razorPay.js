const RazorPay=require('razorpay');

const razorpay = new RazorPay({
    key_id: process.env.RAZOR_PAY_ID,
    key_secret: process.env.RAZOR_PAY_SECRET_KEY,
  });

  module.exports=razorpay;