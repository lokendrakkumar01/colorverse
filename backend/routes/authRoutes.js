// ============================================================
// Auth Routes
// ============================================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  resendVerification,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.post("/resend-verification", protect, resendVerification);

module.exports = router;
