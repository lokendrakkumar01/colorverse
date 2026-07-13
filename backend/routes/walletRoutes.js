// Wallet Routes
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getWallet, getTransactions } = require("../controllers/walletController");

router.get("/", protect, getWallet);
router.get("/transactions", protect, getTransactions);

module.exports = router;
