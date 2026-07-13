// ============================================================
// Withdrawal Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [200, "Minimum withdrawal amount is ₹200"],
    },

    // Withdrawal destination
    withdrawalMethod: {
      type: String,
      enum: ["upi", "bank_transfer", "crypto"],
      required: true,
    },

    // UPI Details
    upiId: {
      type: String,
      default: "",
    },

    // Bank Details
    bankDetails: {
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
    },

    // Admin Processing
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },

    // UTR / Transaction Reference
    transactionReference: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// Indexes
// ============================================================
withdrawalSchema.index({ user: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
