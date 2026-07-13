// ============================================================
// Game Controller - ColorVerse Platform
// ============================================================
const Game = require("../models/Game");
const { placeBet, getCurrentGame, GAME_CONFIG } = require("../services/gameEngine");

// ============================================================
// @route   GET /api/game/current
// @access  Public
// ============================================================
const getCurrentRound = async (req, res, next) => {
  try {
    const game = getCurrentGame();
    res.json({ success: true, game, config: GAME_CONFIG });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/game/bet
// @access  Private
// ============================================================
const placeBetRoute = async (req, res, next) => {
  try {
    const { color, amount } = req.body;
    const userId = req.user._id;

    if (!color || !amount) {
      return res.status(400).json({ success: false, message: "Color and amount are required" });
    }

    const result = await placeBet(userId, color, Number(amount));

    res.json({
      success: true,
      message: `Bet placed on ${color}`,
      ...result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================
// @route   GET /api/game/history
// @access  Private
// ============================================================
const getGameHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const games = await Game.find({
      "bets.user": userId,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("roundNumber period winningColor totalBetAmount status createdAt bets");

    // Filter to show only user's bets
    const personalizedGames = games.map((game) => {
      const userBet = game.bets.find((b) => b.user.toString() === userId.toString());
      return {
        roundNumber: game.roundNumber,
        period: game.period,
        winningColor: game.winningColor,
        status: game.status,
        createdAt: game.createdAt,
        myBet: userBet
          ? {
              color: userBet.color,
              amount: userBet.amount,
              result: userBet.result,
              winAmount: userBet.winAmount,
            }
          : null,
      };
    });

    const total = await Game.countDocuments({
      "bets.user": userId,
      status: "completed",
    });

    res.json({
      success: true,
      games: personalizedGames,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/game/rounds
// @access  Public
// ============================================================
const getRecentRounds = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const rounds = await Game.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("roundNumber period winningColor totalBetAmount totalPlayers status createdAt");

    res.json({ success: true, rounds });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/game/colors
// @access  Public
// ============================================================
const getColors = (req, res) => {
  const colorInfo = [
    { name: "red", hex: "#ef4444", label: "Red" },
    { name: "green", hex: "#22c55e", label: "Green" },
    { name: "blue", hex: "#3b82f6", label: "Blue" },
    { name: "yellow", hex: "#eab308", label: "Yellow" },
    { name: "purple", hex: "#a855f7", label: "Purple" },
    { name: "orange", hex: "#f97316", label: "Orange" },
    { name: "pink", hex: "#ec4899", label: "Pink" },
    { name: "teal", hex: "#14b8a6", label: "Teal" },
    { name: "coral", hex: "#fb7185", label: "Coral" },
    { name: "lime", hex: "#84cc16", label: "Lime" },
  ];

  res.json({ success: true, colors: colorInfo, config: GAME_CONFIG });
};

module.exports = {
  getCurrentRound,
  placeBetRoute,
  getGameHistory,
  getRecentRounds,
  getColors,
};
