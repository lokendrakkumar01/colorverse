// ============================================================
// Wallet Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Balances
    balance: {
      type: Number,
      default: 1000,
      min: [0, "Balance cannot be negative"],
    },
    bonusBalance: {
      type: Number,
      default: 0,
      min: [0, "Bonus balance cannot be negative"],
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },

    // Totals
    totalDeposited: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    totalWon: {
      type: Number,
      default: 0,
    },
    totalLost: {
      type: Number,
      default: 0,
    },
    totalReferralEarned: {
      type: Number,
      default: 0,
    },

    // Status
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// Virtuals
// ============================================================
walletSchema.virtual("totalBalance").get(function () {
  return this.balance + this.bonusBalance;
});

walletSchema.virtual("netProfitLoss").get(function () {
  return this.totalWon - this.totalLost;
});

// ============================================================
// Instance Methods
// ============================================================

// Credit wallet
walletSchema.methods.credit = async function (amount, type = "balance") {
  if (type === "bonus") {
    this.bonusBalance += amount;
  } else {
    this.balance += amount;
  }
  await this.save();
  return this;
};

// Debit wallet (returns false if insufficient funds)
walletSchema.methods.debit = async function (amount) {
  if (this.balance < amount) {
    return { success: false, message: "Insufficient balance" };
  }
  this.balance -= amount;
  await this.save();
  return { success: true };
};

// ============================================================
// Indexes
// ============================================================
walletSchema.index({ user: 1 });

module.exports = mongoose.model("Wallet", walletSchema);
