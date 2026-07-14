// ============================================================
// Game Controller - ColorVerse Platform
// ============================================================
const Game = require("../models/Game");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Notification = require("../models/Notification");
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

// ============================================================
// @route   POST /api/game/instant-game
// @access  Private
// ============================================================
const handleInstantGameResult = async (req, res, next) => {
  try {
    const { gameType, betAmount, won, winAmount, detail } = req.body;
    const userId = req.user._id;

    if (!gameType || !betAmount) {
      return res.status(400).json({ success: false, message: "Game type and bet amount are required" });
    }

    const isFreeTrial = (Date.now() - new Date(req.user.createdAt).getTime()) < 10 * 60 * 1000;
    
    const modeSetting = await SystemSetting.findOne({ key: "gameMode" });
    const isGlobalFree = modeSetting && modeSetting.value === "free";
    const isFree = isFreeTrial || isGlobalFree;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    if (!isFree && wallet.balance < betAmount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // 1. Debit the bet (skip if free play)
    const balanceBeforeBet = wallet.balance;
    if (!isFree) {
      wallet.balance -= betAmount;
      wallet.totalLost += betAmount;
      await wallet.save();
    }

    // Record bet transaction
    await Transaction.create({
      user: userId,
      type: "game_bet",
      amount: isFree ? 0 : betAmount,
      balanceBefore: balanceBeforeBet,
      balanceAfter: wallet.balance,
      status: "completed",
      description: `${isGlobalFree ? "[GLOBAL FREE PLAY] " : isFreeTrial ? "[FREE TRIAL] " : ""}Bet ₹${betAmount} on ${gameType.toUpperCase()} - ${detail}`,
    });

    // 2. If won, credit the win
    let finalBalance = wallet.balance;
    if (won && winAmount > 0) {
      const balanceBeforeWin = wallet.balance;
      wallet.balance += winAmount;
      wallet.totalWon += winAmount;
      await wallet.save();
      finalBalance = wallet.balance;

      // Record win transaction
      await Transaction.create({
        user: userId,
        type: "game_win",
        amount: winAmount,
        balanceBefore: balanceBeforeWin,
        balanceAfter: finalBalance,
        status: "completed",
        description: `Won ₹${winAmount} on ${gameType.toUpperCase()} - ${detail}`,
      });

      // Update User stats
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalGames: 1,
          totalWins: 1,
          totalBetAmount: betAmount,
          totalWinAmount: winAmount,
        },
      });

      // Create Win Notification
      await Notification.create({
        user: userId,
        title: `🏆 Won ₹${winAmount} on ${gameType.toUpperCase()}!`,
        message: `Congratulations! You won ₹${winAmount} playing ${gameType.toUpperCase()}`,
        type: "game_result",
        color: "green",
      });
    } else {
      // Update User stats for loss
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalGames: 1,
          totalLosses: 1,
          totalBetAmount: betAmount,
          totalLossAmount: betAmount,
        },
      });

      // Create Loss Notification
      await Notification.create({
        user: userId,
        title: `Better luck next time in ${gameType.toUpperCase()}`,
        message: `You lost ₹${betAmount} playing ${gameType.toUpperCase()}`,
        type: "game_result",
        color: "red",
      });
    }

    res.json({
      success: true,
      message: won ? `Won ₹${winAmount}` : `Lost ₹${betAmount}`,
      walletBalance: finalBalance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentRound,
  placeBetRoute,
  getGameHistory,
  getRecentRounds,
  getColors,
  handleInstantGameResult,
};
