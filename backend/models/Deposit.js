// ============================================================
// Deposit Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [100, "Minimum deposit amount is ₹100"],
    },

    // Payment Details
    paymentMethod: {
      type: String,
      enum: ["razorpay", "upi", "bank_transfer", "crypto", "admin"],
      default: "razorpay",
    },

    // Razorpay specific
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },

    // Screenshots/Proof (for manual deposits)
    proofImage: {
      type: String,
      default: "",
    },

    // Admin
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

    // UTR / Reference
    utrNumber: {
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
depositSchema.index({ user: 1, createdAt: -1 });
depositSchema.index({ status: 1 });
depositSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model("Deposit", depositSchema);
