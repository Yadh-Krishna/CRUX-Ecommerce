const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReferralSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true },
  referralCode: { type: String, unique: true, required: true },
  referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  rewardCoupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }// Coupon assigned to the referrer
//   rewardForReferred: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }, // Coupon for the referred user
}, { timestamps: true });

module.exports = mongoose.model('Referral', ReferralSchema);