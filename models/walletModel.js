    const mongoose = require("mongoose");
    const { v4: uuidv4 } = require("uuid");

    const walletSchema = new mongoose.Schema(
    {
        userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
        unique: true, // Ensures one wallet per user
        },
        transactions: [
        {
            orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            },
            transactionId: {
            type: String,
            default: () => uuidv4(), // Generates a unique ID for each transaction
            unique: true,
            sparse: true
            },
            transactionType: {
            type: String,
            enum: ["debit", "credit"],
            required: true,
            },
            transactionAmount: {
            type: Number,
            required: true,
            min: 0,
            },
            transactionDate: {
            type: Date,
            default: Date.now,
            },
            transactionStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "completed",
            },
            transactionDescription: {
            type: String,
            },
        },
        ],
    },
    { timestamps: true }
    );

    walletSchema.set('toJSON', { virtuals: true });
    walletSchema.set('toObject', { virtuals: true });

    //  Virtual field: Calculates wallet balance dynamically
    walletSchema.virtual("calculatedBalance").get(function () {
    return this.transactions.reduce((total, txn) => {
        return txn.transactionType === "credit"
        ? total + txn.transactionAmount
        : total - txn.transactionAmount;
    }, 0);
    });

    // Prevent negative balance before adding a debit transaction
    walletSchema.methods.addTransaction = async function (transactionData) {
    if (transactionData.transactionType === "debit") {
        const currentBalance = this.calculatedBalance;
        if (currentBalance < transactionData.transactionAmount) {
        throw new Error("Insufficient balance for this transaction");
        }
    }   
    this.transactions.push(transactionData);
    return this.save();
    };
    
    module.exports = mongoose.model("Wallet", walletSchema);;