// ============================================================
// Admin Controller - ColorVerse Platform
// ============================================================
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Game = require("../models/Game");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const {
  sendDepositConfirmedEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
} = require("../services/emailService");

// ============================================================
// @route   GET /api/admin/dashboard
// @access  Admin
// ============================================================
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalGames,
      completedGames,
      totalDeposits,
      pendingDeposits,
      totalWithdrawals,
      pendingWithdrawals,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true, isBanned: false }),
      User.countDocuments({ isBanned: true }),
      Game.countDocuments(),
      Game.countDocuments({ status: "completed" }),
      Deposit.countDocuments({ status: "completed" }),
      Deposit.countDocuments({ status: "pending" }),
      Withdrawal.countDocuments(),
      Withdrawal.countDocuments({ status: "pending" }),
    ]);

    // Revenue stats
    const revenueStats = await Deposit.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const withdrawalStats = await Withdrawal.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const gameStats = await Game.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalBet: { $sum: "$totalBetAmount" },
          totalWin: { $sum: "$totalWinAmount" },
          houseProfit: { $sum: "$houseProfitLoss" },
        },
      },
    ]);

    // Recent users
    const recentUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("username email createdAt isEmailVerified isBanned");

    // Recent games
    const recentGames = await Game.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("roundNumber period winningColor totalBetAmount totalPlayers houseProfitLoss");

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
      role: "user",
    });

    // Revenue today
    const revenueToday = await Deposit.aggregate([
      { $match: { status: "completed", processedAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, banned: bannedUsers, newToday: newUsersToday },
        games: { total: totalGames, completed: completedGames },
        deposits: { total: totalDeposits, pending: pendingDeposits },
        withdrawals: { total: totalWithdrawals, pending: pendingWithdrawals },
        revenue: {
          totalDeposited: revenueStats[0]?.total || 0,
          totalWithdrawn: withdrawalStats[0]?.total || 0,
          totalBet: gameStats[0]?.totalBet || 0,
          totalWin: gameStats[0]?.totalWin || 0,
          houseProfit: gameStats[0]?.houseProfit || 0,
          revenueToday: revenueToday[0]?.total || 0,
        },
      },
      recentUsers,
      recentGames,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/admin/users
// @access  Admin
// ============================================================
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status; // active | banned | all

    const filter = { role: "user" };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "banned") filter.isBanned = true;
    else if (status === "active") filter.isActive = true;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password");

    const total = await User.countDocuments(filter);

    // Get wallet balances
    const userIds = users.map((u) => u._id);
    const wallets = await Wallet.find({ user: { $in: userIds } });
    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.user.toString()] = w));

    const usersWithWallet = users.map((u) => ({
      ...u.toObject(),
      wallet: walletMap[u._id.toString()] || null,
    }));

    res.json({
      success: true,
      users: usersWithWallet,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   PATCH /api/admin/users/:id/ban
// @access  Admin
// ============================================================
const banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot ban admin" });
    }

    user.isBanned = !user.isBanned;
    user.banReason = user.isBanned ? (reason || "Violation of terms") : "";
    await user.save();

    res.json({
      success: true,
      message: user.isBanned ? "User banned" : "User unbanned",
      user: { id: user._id, isBanned: user.isBanned, banReason: user.banReason },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/admin/users/:id/credit
// @access  Admin
// ============================================================
const creditUserWallet = async (req, res, next) => {
  try {
    const { amount, note } = req.body;
    const wallet = await Wallet.findOne({ user: req.params.id });

    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    const balanceBefore = wallet.balance;
    wallet.balance += Number(amount);
    await wallet.save();

    await Transaction.create({
      user: req.params.id,
      type: "admin_credit",
      amount: Number(amount),
      balanceBefore,
      balanceAfter: wallet.balance,
      status: "completed",
      description: note || `Admin credit by ${req.user.username}`,
    });

    res.json({
      success: true,
      message: `₹${amount} credited to wallet`,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/admin/deposits
// @access  Admin
// ============================================================
const getDeposits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "all";

    const filter = {};
    if (status !== "all") filter.status = status;

    const deposits = await Deposit.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Deposit.countDocuments(filter);

    res.json({
      success: true,
      deposits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   PATCH /api/admin/deposits/:id/approve
// @access  Admin
// ============================================================
const approveDeposit = async (req, res, next) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate("user");

    if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
    if (deposit.status === "completed") {
      return res.status(400).json({ success: false, message: "Deposit already processed" });
    }

    // Credit wallet
    const wallet = await Wallet.findOne({ user: deposit.user._id });
    const balanceBefore = wallet.balance;
    wallet.balance += deposit.amount;
    wallet.totalDeposited += deposit.amount;
    await wallet.save();

    // Update deposit
    deposit.status = "completed";
    deposit.processedBy = req.user._id;
    deposit.processedAt = new Date();
    deposit.adminNote = req.body.note || "";
    await deposit.save();

    // Record transaction
    await Transaction.create({
      user: deposit.user._id,
      type: "deposit",
      amount: deposit.amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: "completed",
      depositId: deposit._id,
      description: `Deposit approved by admin`,
    });

    // Send email and notification
    await sendDepositConfirmedEmail(deposit.user, deposit.amount, deposit._id.toString());
    await Notification.create({
      user: deposit.user._id,
      title: "Deposit Approved ✅",
      message: `Your deposit of ₹${deposit.amount} has been approved.`,
      type: "deposit_approved",
      color: "green",
    });

    res.json({ success: true, message: "Deposit approved", deposit });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/admin/withdrawals
// @access  Admin
// ============================================================
const getWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "pending";

    const filter = {};
    if (status !== "all") filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Withdrawal.countDocuments(filter);

    res.json({
      success: true,
      withdrawals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   PATCH /api/admin/withdrawals/:id/approve
// @access  Admin
// ============================================================
const approveWithdrawal = async (req, res, next) => {
  try {
    const { transactionReference } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id).populate("user");

    if (!withdrawal) return res.status(404).json({ success: false, message: "Withdrawal not found" });
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ success: false, message: "Withdrawal already processed" });
    }

    // Update withdrawal
    withdrawal.status = "completed";
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.transactionReference = transactionReference || "";
    await withdrawal.save();

    // Update wallet totals
    const wallet = await Wallet.findOne({ user: withdrawal.user._id });
    wallet.totalWithdrawn += withdrawal.amount;
    await wallet.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { withdrawalId: withdrawal._id },
      { status: "completed" }
    );

    // Send email and notification
    await sendWithdrawalApprovedEmail(
      withdrawal.user,
      withdrawal.amount,
      transactionReference || withdrawal._id.toString()
    );
    await Notification.create({
      user: withdrawal.user._id,
      title: "Withdrawal Approved ✅",
      message: `Your withdrawal of ₹${withdrawal.amount} has been processed.`,
      type: "withdrawal_approved",
      color: "green",
    });

    res.json({ success: true, message: "Withdrawal approved", withdrawal });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   PATCH /api/admin/withdrawals/:id/reject
// @access  Admin
// ============================================================
const rejectWithdrawal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id).populate("user");

    if (!withdrawal) return res.status(404).json({ success: false, message: "Withdrawal not found" });
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ success: false, message: "Withdrawal already processed" });
    }

    // Refund wallet
    const wallet = await Wallet.findOne({ user: withdrawal.user._id });
    wallet.balance += withdrawal.amount;
    await wallet.save();

    // Update withdrawal
    withdrawal.status = "rejected";
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.rejectionReason = reason || "Rejected by admin";
    await withdrawal.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { withdrawalId: withdrawal._id },
      { status: "failed" }
    );

    // Send email and notification
    await sendWithdrawalRejectedEmail(withdrawal.user, withdrawal.amount, reason);
    await Notification.create({
      user: withdrawal.user._id,
      title: "Withdrawal Rejected ❌",
      message: `Your withdrawal of ₹${withdrawal.amount} was rejected. ${reason || ""}. Amount refunded to wallet.`,
      type: "withdrawal_rejected",
      color: "red",
    });

    res.json({ success: true, message: "Withdrawal rejected and amount refunded", withdrawal });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/admin/games
// @access  Admin
// ============================================================
const getGames = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const games = await Game.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-bets");

    const total = await Game.countDocuments({ status: "completed" });

    res.json({
      success: true,
      games,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/admin/analytics
// @access  Admin
// ============================================================
const getAnalytics = async (req, res, next) => {
  try {
    // Last 7 days revenue
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [depositsDay, withdrawalsDay, usersDay, gamesDay] = await Promise.all([
        Deposit.aggregate([
          { $match: { status: "completed", processedAt: { $gte: date, $lt: nextDate } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Withdrawal.aggregate([
          { $match: { status: "completed", processedAt: { $gte: date, $lt: nextDate } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        User.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
        Game.aggregate([
          { $match: { status: "completed", createdAt: { $gte: date, $lt: nextDate } } },
          { $group: { _id: null, totalBet: { $sum: "$totalBetAmount" }, houseProfit: { $sum: "$houseProfitLoss" }, count: { $sum: 1 } } },
        ]),
      ]);

      last7Days.push({
        date: date.toISOString().split("T")[0],
        deposits: depositsDay[0]?.total || 0,
        withdrawals: withdrawalsDay[0]?.total || 0,
        newUsers: usersDay,
        games: gamesDay[0]?.count || 0,
        totalBet: gamesDay[0]?.totalBet || 0,
        houseProfit: gamesDay[0]?.houseProfit || 0,
      });
    }

    // Color win distribution
    const colorWinDist = await Game.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$winningColor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        last7Days,
        colorWinDistribution: colorWinDist,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  banUser,
  creditUserWallet,
  getDeposits,
  approveDeposit,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getGames,
  getAnalytics,
};
