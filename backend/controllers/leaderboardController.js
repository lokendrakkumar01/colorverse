// ============================================================
// Leaderboard Controller - ColorVerse Platform
// ============================================================
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Game = require("../models/Game");

// ============================================================
// @route   GET /api/leaderboard
// @access  Public
// ============================================================
const getLeaderboard = async (req, res, next) => {
  try {
    const type = req.query.type || "earnings"; // earnings | wins | games
    const period = req.query.period || "all"; // all | weekly | monthly
    const limit = parseInt(req.query.limit) || 20;

    let pipeline = [];

    if (period === "weekly") {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      // Weekly is tricky with current model - use all-time for now and filter by recent games
      pipeline.push({ $match: { createdAt: { $gte: weekStart } } });
    } else if (period === "monthly") {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - 1);
      pipeline.push({ $match: { createdAt: { $gte: monthStart } } });
    }

    let users;
    if (type === "earnings") {
      users = await User.find({ isActive: true, isBanned: false })
        .sort({ totalWinAmount: -1 })
        .limit(limit)
        .select("username avatar totalWinAmount totalGames totalWins createdAt");
    } else if (type === "wins") {
      users = await User.find({ isActive: true, isBanned: false })
        .sort({ totalWins: -1 })
        .limit(limit)
        .select("username avatar totalWins totalGames totalWinAmount createdAt");
    } else {
      users = await User.find({ isActive: true, isBanned: false })
        .sort({ totalGames: -1 })
        .limit(limit)
        .select("username avatar totalGames totalWins totalWinAmount createdAt");
    }

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      username: u.username,
      avatar: u.avatar,
      totalGames: u.totalGames,
      totalWins: u.totalWins,
      totalEarnings: u.totalWinAmount,
      winRate: u.totalGames > 0 ? ((u.totalWins / u.totalGames) * 100).toFixed(1) : "0.0",
      joinedAt: u.createdAt,
    }));

    // My rank
    let myRank = null;
    if (req.user) {
      const myIndex = leaderboard.findIndex(
        (u) => u.username === req.user.username
      );
      if (myIndex === -1) {
        // Find rank outside top
        const countAbove = await User.countDocuments({
          isActive: true,
          isBanned: false,
          ...(type === "earnings"
            ? { totalWinAmount: { $gt: req.user.totalWinAmount } }
            : type === "wins"
            ? { totalWins: { $gt: req.user.totalWins } }
            : { totalGames: { $gt: req.user.totalGames } }),
        });
        myRank = countAbove + 1;
      } else {
        myRank = myIndex + 1;
      }
    }

    res.json({
      success: true,
      leaderboard,
      myRank,
      type,
      period,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
