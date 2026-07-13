// Withdrawal Routes
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { requestWithdrawal, getWithdrawalHistory, cancelWithdrawal } = require("../controllers/withdrawalController");

router.post("/request", protect, requestWithdrawal);
router.get("/history", protect, getWithdrawalHistory);
router.delete("/:id/cancel", protect, cancelWithdrawal);

module.exports = router;
