// ============================================================
// Referral Controller - ColorVerse Platform
// ============================================================
const Referral = require("../models/Referral");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

// ============================================================
// @route   GET /api/referrals/dashboard
// @access  Private
// ============================================================
const getReferralDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all referrals made by user
    const referrals = await Referral.find({ referrer: userId })
      .populate("referee", "username email createdAt totalGames")
      .sort({ createdAt: -1 });

    const wallet = await Wallet.findOne({ user: userId });

    const stats = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter((r) => r.status === "completed").length,
      pendingReferrals: referrals.filter((r) => r.status === "pending").length,
      totalEarned: wallet?.totalReferralEarned || 0,
      referralCode: req.user.referralCode,
      referralLink: `${process.env.CLIENT_URL}/register?ref=${req.user.referralCode}`,
    };

    res.json({
      success: true,
      stats,
      referrals: referrals.map((r) => ({
        id: r._id,
        referee: {
          username: r.referee?.username,
          email: r.referee?.email,
          joinedAt: r.referee?.createdAt,
          totalGames: r.referee?.totalGames,
        },
        status: r.status,
        bonusAmount: r.bonusAmount,
        bonusPaid: r.bonusPaid,
        bonusPaidAt: r.bonusPaidAt,
        totalCommissionEarned: r.totalCommissionEarned,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/referrals/validate/:code
// @access  Public
// ============================================================
const validateReferralCode = async (req, res, next) => {
  try {
    const user = await User.findOne({
      referralCode: req.params.code.toUpperCase(),
    }).select("username referralCode");

    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid referral code" });
    }

    res.json({
      success: true,
      message: "Valid referral code",
      referrer: { username: user.username, referralCode: user.referralCode },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReferralDashboard, validateReferralCode };
