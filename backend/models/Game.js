// ============================================================
// Game Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");

// Available colors in the game
const GAME_COLORS = [
  "red", "green", "blue", "yellow", "purple",
  "orange", "pink", "teal", "coral", "lime",
];

const betSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  color: {
    type: String,
    enum: GAME_COLORS,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [1, "Minimum bet is ₹1"],
  },
  multiplier: {
    type: Number,
    default: 9, // 9x payout for correct color (10 colors)
  },
  result: {
    type: String,
    enum: ["win", "loss", "pending"],
    default: "pending",
  },
  winAmount: {
    type: Number,
    default: 0,
  },
});

const gameSchema = new mongoose.Schema(
  {
    // Game Round Info
    roundNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    period: {
      type: String,
      required: true,
      unique: true,
    }, // e.g., "20240101001"

    // Timing
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 30, // seconds
    },

    // Game State
    status: {
      type: String,
      enum: ["waiting", "betting", "processing", "completed", "cancelled"],
      default: "waiting",
    },

    // Result
    winningColor: {
      type: String,
      enum: GAME_COLORS,
      default: null,
    },

    // Bets
    bets: [betSchema],

    // Aggregated Stats
    totalBetAmount: {
      type: Number,
      default: 0,
    },
    totalPlayers: {
      type: Number,
      default: 0,
    },
    totalWinAmount: {
      type: Number,
      default: 0,
    },
    houseProfitLoss: {
      type: Number,
      default: 0,
    },

    // Admin Override
    isManualResult: {
      type: Boolean,
      default: false,
    },
    manualResultSetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Color distribution of bets
    colorDistribution: {
      type: Map,
      of: Number,
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
gameSchema.index({ roundNumber: -1 });
gameSchema.index({ period: -1 });
gameSchema.index({ status: 1 });
gameSchema.index({ createdAt: -1 });

// Export color list for use in other files
gameSchema.statics.COLORS = GAME_COLORS;

module.exports = mongoose.model("Game", gameSchema);
module.exports.GAME_COLORS = GAME_COLORS;
