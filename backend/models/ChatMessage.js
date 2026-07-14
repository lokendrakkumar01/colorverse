// ============================================================
// Chat Message Model - User-to-User Direct Messages
// ============================================================
const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    image: {
      type: String, // Base64 image attachment
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for faster queries of chat histories
chatMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
