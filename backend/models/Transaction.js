// ============================================================
// Transaction Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Transaction Details
    type: {
      type: String,
      required: true,
      enum: [
        "deposit",
        "withdrawal",
        "game_bet",
        "game_win",
        "game_loss",
        "referral_bonus",
        "bonus_credit",
        "refund",
        "admin_credit",
        "admin_debit",
      ],
    },

    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },

    // Balance before and after
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "completed",
    },

    // Reference IDs
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      default: null,
    },
    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
    },
    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdrawal",
      default: null,
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      default: null,
    },

    // Description
    description: {
      type: String,
      default: "",
    },

    // Meta
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// Indexes for fast queries
// ============================================================
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
