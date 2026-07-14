// ============================================================
// User Model - ColorVerse Platform
// ============================================================
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === "") return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: "Please provide a valid Indian phone number",
      },
    },

    // Profile
    avatar: {
      type: String,
      default: "",
    },
    avatarPublicId: {
      type: String,
      default: "",
    },

    // Role
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Account Status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: "",
    },

    // Email Verification
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password Reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Referral System
    referralCode: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase(),
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Gaming Stats
    totalGames: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    totalBetAmount: { type: Number, default: 0 },
    totalWinAmount: { type: Number, default: 0 },
    totalLossAmount: { type: Number, default: 0 },

    // Login Tracking
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    lastIP: String,

    // Notifications Settings
    notificationsEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// Virtuals
// ============================================================
userSchema.virtual("profitLoss").get(function () {
  return this.totalWinAmount - this.totalLossAmount;
});

userSchema.virtual("winRate").get(function () {
  if (this.totalGames === 0) return 0;
  return ((this.totalWins / this.totalGames) * 100).toFixed(2);
});

// ============================================================
// Pre-save Middleware - Hash Password
// ============================================================
userSchema.pre("save", async function (next) {
  // Only hash if password was modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Instance Methods
// ============================================================

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// ============================================================
// Indexes
// ============================================================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
