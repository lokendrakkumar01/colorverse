// ============================================================
// Auth Controller - ColorVerse Platform
// ============================================================
const crypto = require("crypto");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Referral = require("../models/Referral");
const Notification = require("../models/Notification");
const generateToken = require("../utils/generateToken");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require("../services/emailService");

// ============================================================
// @route   POST /api/auth/register
// @access  Public
// ============================================================
const register = async (req, res, next) => {
  try {
    const { username, email, password, phone, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ success: false, message: "Email already registered" });
      }
      return res.status(409).json({ success: false, message: "Username already taken" });
    }

    // Find referrer if referral code provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      phone,
      referredBy: referrer?._id || null,
    });

    // Create wallet for user
    const newWallet = await Wallet.create({ user: user._id });

    // Create referral record if applicable
    if (referrer) {
      await Referral.create({
        referrer: referrer._id,
        referee: user._id,
        referralCode: referralCode.toUpperCase(),
      });
    }

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email (don't block registration if email fails)
    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      await sendVerificationEmail(user, verificationUrl);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
    }

    // Create welcome notification
    await Notification.create({
      user: user._id,
      title: "Welcome to ColorVerse! 🎮",
      message: "Your account has been created. Please verify your email to start playing.",
      type: "system",
      color: "purple",
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
      },
      wallet: {
        balance: newWallet.balance,
        bonusBalance: newWallet.bonusBalance,
        totalDeposited: newWallet.totalDeposited,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/auth/login
// @access  Public
// ============================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Account banned: ${user.banReason}`,
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Update login tracking
    user.lastLogin = new Date();
    user.loginCount += 1;
    user.lastIP = req.ip;
    await user.save();

    // Get wallet
    const wallet = await Wallet.findOne({ user: user._id });

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        totalGames: user.totalGames,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        lastLogin: user.lastLogin,
      },
      wallet: wallet
        ? {
            balance: wallet.balance,
            bonusBalance: wallet.bonusBalance,
            totalDeposited: wallet.totalDeposited,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/auth/verify-email/:token
// @access  Public
// ============================================================
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email (don't block if it fails)
    try {
      await sendWelcomeEmail(user);
    } catch (e) {
      console.error("Welcome email failed:", e.message);
    }

    // Check for referral bonus
    const referral = await Referral.findOne({ referee: user._id });
    if (referral && referral.bonusTrigger === "on_signup" && !referral.bonusPaid) {
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
      }
    }

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to ColorVerse.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================================
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security: don't reveal if email exists
      return res.json({
        success: true,
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendPasswordResetEmail(user, resetUrl);
    } catch (emailErr) {
      console.error("Password reset email failed:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ============================================================
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: "Password reset successful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/auth/me
// @access  Private
// ============================================================
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const wallet = await Wallet.findOne({ user: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        totalGames: user.totalGames,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        totalBetAmount: user.totalBetAmount,
        totalWinAmount: user.totalWinAmount,
        totalLossAmount: user.totalLossAmount,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      wallet: wallet
        ? {
            balance: wallet.balance,
            bonusBalance: wallet.bonusBalance,
            referralEarnings: wallet.referralEarnings,
            totalDeposited: wallet.totalDeposited,
            totalWithdrawn: wallet.totalWithdrawn,
            totalWon: wallet.totalWon,
            totalLost: wallet.totalLost,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   POST /api/auth/resend-verification
// @access  Private
// ============================================================
const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email already verified" });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user, verificationUrl);

    res.json({ success: true, message: "Verification email resent" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  resendVerification,
};
