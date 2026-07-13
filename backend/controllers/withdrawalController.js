// ============================================================
// Withdrawal Controller - ColorVerse Platform
// ============================================================
const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const MIN_WITHDRAWAL = 200;
const MAX_WITHDRAWAL = 50000;

// ============================================================
// @route   POST /api/withdrawals/request
// @access  Private
// ============================================================
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, withdrawalMethod, upiId, bankDetails } = req.body;

    // Validate amount
    if (!amount || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}`,
      });
    }
    if (amount > MAX_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal is ₹${MAX_WITHDRAWAL}`,
      });
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Check pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
      user: req.user._id,
      status: { $in: ["pending", "approved", "processing"] },
    });
    if (pendingWithdrawal) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending withdrawal request",
      });
    }

    // Deduct from wallet (hold)
    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      withdrawalMethod,
      upiId,
      bankDetails,
      status: "pending",
    });

    // Record hold transaction
    await Transaction.create({
      user: req.user._id,
      type: "withdrawal",
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: "pending",
      withdrawalId: withdrawal._id,
      description: `Withdrawal request ₹${amount} via ${withdrawalMethod}`,
    });

    // Notify user
    await Notification.create({
      user: req.user._id,
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal of ₹${amount} is under review. Processing within 24-48 hours.`,
      type: "system",
      color: "yellow",
    });

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        method: withdrawal.withdrawalMethod,
      },
      walletBalance: wallet.balance,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/withdrawals/history
// @access  Private
// ============================================================
const getWithdrawalHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const withdrawals = await Withdrawal.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Withdrawal.countDocuments({ user: req.user._id });

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
// @route   DELETE /api/withdrawals/:id/cancel
// @access  Private
// ============================================================
const cancelWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "pending",
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found or cannot be cancelled",
      });
    }

    // Refund wallet
    const wallet = await Wallet.findOne({ user: req.user._id });
    wallet.balance += withdrawal.amount;
    await wallet.save();

    withdrawal.status = "cancelled";
    await withdrawal.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { withdrawalId: withdrawal._id },
      { status: "cancelled" }
    );

    res.json({
      success: true,
      message: "Withdrawal cancelled and amount refunded to wallet",
      walletBalance: wallet.balance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestWithdrawal, getWithdrawalHistory, cancelWithdrawal };
