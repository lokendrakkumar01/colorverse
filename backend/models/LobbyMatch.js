// ============================================================
// Lobby Match Model - Custom Ludo/Carrom Matches
// ============================================================
const mongoose = require("mongoose");

const lobbyMatchSchema = new mongoose.Schema(
  {
    lobbyId: {
      type: String,
      required: true,
      unique: true,
    },
    gameName: {
      type: String,
      required: true,
    },
    creator: {
      type: String,
      required: true,
    },
    opponent: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    roomCode: {
      type: String,
      default: "",
    },
    winner: {
      type: String,
      default: "",
    },
    screenshot: {
      type: String, // Base64 string of verification image
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LobbyMatch", lobbyMatchSchema);
