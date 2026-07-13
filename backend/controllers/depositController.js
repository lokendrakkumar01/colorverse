// ============================================================
// Deposit Controller - Razorpay Integration
// ============================================================
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Deposit = require("../models/Deposit");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Referral = require("../models/Referral");
const Notification = require("../models/Notification");
const { sendDepositConfirmedEmail } = require("../services/emailService");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// @route   POST /api/deposits/create-order
// @access  Private
// ============================================================
const createOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Minimum deposit is ₹100" });
    }
    if (amount > 100000) {
      return res.status(400).json({ success: false, message: "Maximum deposit is ₹1,00,000" });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `cv_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        username: req.user.username,
      },
    });

    // Save deposit record
    const deposit = await Deposit.create({
      user: req.user._id,
      amount,
      paymentMethod: "razorpay",
      razorpayOrderId: order.id,
      status: "pending",
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      depositId: deposit._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/deposits/verify-payment
// @access  Private
// ============================================================
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, depositId } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Find deposit
    const deposit = await Deposit.findOne({
      _id: depositId,
      user: req.user._id,
      status: "pending",
    });

    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit record not found" });
    }

    // Update deposit
    deposit.status = "completed";
    deposit.razorpayPaymentId = razorpay_payment_id;
    deposit.razorpaySignature = razorpay_signature;
    deposit.processedAt = new Date();
    await deposit.save();

    // Credit wallet
    const wallet = await Wallet.findOne({ user: req.user._id });
    const balanceBefore = wallet.balance;
    wallet.balance += deposit.amount;
    wallet.totalDeposited += deposit.amount;
    await wallet.save();

    // Record transaction
    await Transaction.create({
      user: req.user._id,
      type: "deposit",
      amount: deposit.amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: "completed",
      depositId: deposit._id,
      description: `Deposit via Razorpay (${razorpay_payment_id})`,
    });

    // Handle referral bonus on first deposit
    const referral = await Referral.findOne({
      referee: req.user._id,
      bonusTrigger: "on_first_deposit",
      bonusPaid: false,
    });

    if (referral) {
      const referrerWallet = await Wallet.findOne({ user: referral.referrer });
      if (referrerWallet) {
        referrerWallet.balance += referral.bonusAmount;
        referrerWallet.referralEarnings += referral.bonusAmount;
        referrerWallet.totalReferralEarned += referral.bonusAmount;
        await referrerWallet.save();

        referral.bonusPaid = true;
        referral.bonusPaidAt = new Date();
        referral.status = "completed";
        await referral.save();

        // Notify referrer
        await Notification.create({
          user: referral.referrer,
          title: "Referral Bonus Earned! 💰",
          message: `You earned ₹${referral.bonusAmount} referral bonus!`,
          type: "referral_bonus",
          color: "green",
        });
      }
    }

    // Send confirmation email
    await sendDepositConfirmedEmail(req.user, deposit.amount, razorpay_payment_id);

    // Create notification
    await Notification.create({
      user: req.user._id,
      title: "Deposit Successful! 💰",
      message: `₹${deposit.amount} has been added to your wallet.`,
      type: "deposit_approved",
      color: "green",
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${req.user._id}`).emit("wallet:updated", {
        balance: wallet.balance,
        bonusBalance: wallet.bonusBalance,
      });
    }

    res.json({
      success: true,
      message: `₹${deposit.amount} deposited successfully`,
      deposit: {
        id: deposit._id,
        amount: deposit.amount,
        status: deposit.status,
      },
      wallet: { balance: wallet.balance },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/deposits/history
// @access  Private
// ============================================================
const getDepositHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const deposits = await Deposit.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Deposit.countDocuments({ user: req.user._id });

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
// @route   POST /api/deposits/upi-deposit
// @access  Private
// ============================================================
const submitUpiDeposit = async (req, res, next) => {
  try {
    const { amount, utrNumber, proofImage } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Minimum deposit is ₹100" });
    }
    if (amount > 100000) {
      return res.status(400).json({ success: false, message: "Maximum deposit is ₹1,00,000" });
    }
    if (!utrNumber || utrNumber.trim().length < 6) {
      return res.status(400).json({ success: false, message: "Please enter a valid UTR / Transaction Reference number" });
    }

    const existingDeposit = await Deposit.findOne({ utrNumber: utrNumber.trim() });
    if (existingDeposit) {
      return res.status(400).json({ success: false, message: "This UTR number has already been submitted" });
    }

    const deposit = await Deposit.create({
      user: req.user._id,
      amount,
      paymentMethod: "upi",
      utrNumber: utrNumber.trim(),
      proofImage: proofImage || "",
      status: "pending",
    });

    await Notification.create({
      user: req.user._id,
      title: "Deposit Submitted ⏳",
      message: `Your manual deposit request of ₹${amount} is pending admin approval.`,
      type: "deposit_pending",
      color: "amber",
    });

    res.json({
      success: true,
      message: "Deposit details submitted successfully. Pending admin verification.",
      depositId: deposit._id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getDepositHistory, submitUpiDeposit };
