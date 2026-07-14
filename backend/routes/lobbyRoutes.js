// ============================================================
// Lobby Match Routes
// ============================================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/adminAuth");
const {
  createLobby,
  getActiveLobbies,
  joinLobby,
  setRoomCode,
  claimVictory,
  confirmDefeat,
  getPendingLobbies,
  resolveLobby,
} = require("../controllers/lobbyController");

// Public/User Routes
router.post("/create", protect, createLobby);
router.get("/active", protect, getActiveLobbies);
router.post("/join", protect, joinLobby);
router.post("/set-code", protect, setRoomCode);
router.post("/claim-win", protect, claimVictory);
router.post("/lose", protect, confirmDefeat);

// Admin Routes
router.get("/admin/pending", protect, isAdmin, getPendingLobbies);
router.post("/admin/resolve/:id", protect, isAdmin, resolveLobby);

module.exports = router;
