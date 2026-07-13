// Leaderboard Routes
const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const { getLeaderboard } = require("../controllers/leaderboardController");

router.get("/", optionalAuth, getLeaderboard);

module.exports = router;
