// Deposit Routes
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { createOrder, verifyPayment, getDepositHistory, submitUpiDeposit } = require("../controllers/depositController");

router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.post("/upi-deposit", protect, submitUpiDeposit);
router.get("/history", protect, getDepositHistory);

module.exports = router;
