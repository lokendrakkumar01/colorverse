// ============================================================
// Referral Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    referralCode: {
      type: String,
      required: true,
    },

    // Bonus
    bonusAmount: {
      type: Number,
      default: 50, // ₹50 referral bonus
    },
    bonusPaid: {
      type: Boolean,
      default: false,
    },
    bonusPaidAt: {
      type: Date,
      default: null,
    },

    // Bonus trigger condition
    bonusTrigger: {
      type: String,
      enum: ["on_signup", "on_first_deposit", "on_first_game"],
      default: "on_first_deposit",
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    // Commission (percentage of referee's bets)
    commissionRate: {
      type: Number,
      default: 2, // 2% commission
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// Indexes
// ============================================================
referralSchema.index({ referrer: 1 });
referralSchema.index({ referee: 1 });
referralSchema.index({ referralCode: 1 });

module.exports = mongoose.model("Referral", referralSchema);
