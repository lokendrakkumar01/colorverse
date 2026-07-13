// Referral Routes
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getReferralDashboard, validateReferralCode } = require("../controllers/referralController");

router.get("/dashboard", protect, getReferralDashboard);
router.get("/validate/:code", validateReferralCode);

module.exports = router;
