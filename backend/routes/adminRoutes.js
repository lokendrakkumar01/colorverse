// Admin Routes
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/adminAuth");
const {
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
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

// Dashboard
router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);

// User management
router.get("/users", getUsers);
router.patch("/users/:id/ban", banUser);
router.post("/users/:id/credit", creditUserWallet);

// Deposit management
router.get("/deposits", getDeposits);
router.patch("/deposits/:id/approve", approveDeposit);

// Withdrawal management
router.get("/withdrawals", getWithdrawals);
router.patch("/withdrawals/:id/approve", approveWithdrawal);
router.patch("/withdrawals/:id/reject", rejectWithdrawal);

// Game management
router.get("/games", getGames);

module.exports = router;
