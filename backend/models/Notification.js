// ============================================================
// Notification Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "game_result",
        "deposit_pending",
        "deposit_approved",
        "deposit_rejected",
        "withdrawal_approved",
        "withdrawal_rejected",
        "referral_bonus",
        "system",
        "admin",
        "promotion",
      ],
      default: "system",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Reference data
    link: {
      type: String,
      default: "",
    },

    // Icon / Color
    icon: {
      type: String,
      default: "bell",
    },
    color: {
      type: String,
      enum: ["green", "red", "blue", "yellow", "purple", "gray", "amber"],
      default: "blue",
    },

    // Metadata
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
// Indexes
// ============================================================
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
