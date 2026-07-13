// Game Routes
const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const { getCurrentRound, placeBetRoute, getGameHistory, getRecentRounds, getColors } = require("../controllers/gameController");

router.get("/current", getCurrentRound);
router.post("/bet", protect, placeBetRoute);
router.get("/history", protect, getGameHistory);
router.get("/rounds", getRecentRounds);
router.get("/colors", getColors);

module.exports = router;
