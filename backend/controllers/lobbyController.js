// ============================================================
// Lobby Match Controller - Custom Tournaments
// ============================================================
const LobbyMatch = require("../models/LobbyMatch");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const User = require("../models/User");

// 1. Create a Lobby
const createLobby = async (req, res, next) => {
  try {
    const { lobbyId, gameName, amount } = req.body;
    const username = req.user.username;

    if (!lobbyId || !gameName || !amount) {
      return res.status(400).json({ success: false, message: "Lobby details are required" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // Debit balance
    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    // Log transaction
    await Transaction.create({
      user: req.user._id,
      type: "game_bet",
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: "completed",
      description: `Escrow Bet: Created ${gameName} Lobby #${lobbyId}`,
    });

    const match = await LobbyMatch.create({
      lobbyId,
      gameName,
      creator: username,
      amount,
    });

    res.json({ success: true, match, walletBalance: wallet.balance });
  } catch (error) {
    next(error);
  }
};

// 2. Get Open Lobbies
const getActiveLobbies = async (req, res, next) => {
  try {
    const lobbies = await LobbyMatch.find({ status: "pending", opponent: "" });
    res.json({ success: true, lobbies });
  } catch (error) {
    next(error);
  }
};

// 3. Join a Lobby
const joinLobby = async (req, res, next) => {
  try {
    const { lobbyId } = req.body;
    const username = req.user.username;

    const match = await LobbyMatch.findOne({ lobbyId, status: "pending" });
    if (!match) {
      return res.status(404).json({ success: false, message: "Lobby not found" });
    }

    if (match.creator === username) {
      return res.status(400).json({ success: false, message: "Cannot join your own lobby" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < match.amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance to join" });
    }

    // Debit balance
    const balanceBefore = wallet.balance;
    wallet.balance -= match.amount;
    await wallet.save();

    // Log transaction
    await Transaction.create({
      user: req.user._id,
      type: "game_bet",
      amount: match.amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: "completed",
      description: `Escrow Bet: Joined ${match.gameName} Lobby #${lobbyId}`,
    });

    match.opponent = username;
    await match.save();

    res.json({ success: true, match, walletBalance: wallet.balance });
  } catch (error) {
    next(error);
  }
};

// 4. Set Room Code
const setRoomCode = async (req, res, next) => {
  try {
    const { lobbyId, roomCode } = req.body;

    const match = await LobbyMatch.findOne({ lobbyId });
    if (!match) {
      return res.status(404).json({ success: false, message: "Lobby not found" });
    }

    match.roomCode = roomCode;
    await match.save();

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// 5. Claim Victory (Winner uploads screenshot)
const claimVictory = async (req, res, next) => {
  try {
    const { lobbyId, screenshot } = req.body;
    const username = req.user.username;

    const match = await LobbyMatch.findOne({ lobbyId });
    if (!match) {
      return res.status(404).json({ success: false, message: "Lobby not found" });
    }

    match.winner = username;
    match.screenshot = screenshot; // Base64 proof
    await match.save();

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// 6. Confirm Defeat (Auto-completes and credits creator)
const confirmDefeat = async (req, res, next) => {
  try {
    const { lobbyId } = req.body;
    const username = req.user.username;

    const match = await LobbyMatch.findOne({ lobbyId });
    if (!match) {
      return res.status(404).json({ success: false, message: "Lobby not found" });
    }

    // Determine winner (the other player)
    const winnerName = match.creator === username ? match.opponent : match.creator;
    const winnerUser = await User.findOne({ username: winnerName });
    
    if (!winnerUser) {
      return res.status(404).json({ success: false, message: "Winner not found" });
    }

    const prize = Math.round(match.amount * 1.8);
    const wallet = await Wallet.findOne({ user: winnerUser._id });

    if (wallet) {
      const balanceBefore = wallet.balance;
      wallet.balance += prize;
      await wallet.save();

      // Log transaction
      await Transaction.create({
        user: winnerUser._id,
        type: "game_win",
        amount: prize,
        balanceBefore,
        balanceAfter: wallet.balance,
        status: "completed",
        description: `Won Lobby Match #${lobbyId} in ${match.gameName} (Defeat confirmed by opponent)`,
      });

      // Notification
      await Notification.create({
        user: winnerUser._id,
        title: "🏆 Lobby Victory Confirmed!",
        message: `Your opponent confirmed defeat. ₹${prize} credited to wallet.`,
        type: "game_result",
        color: "green",
      });
    }

    match.status = "approved";
    match.winner = winnerName;
    await match.save();

    res.json({ success: true, message: "Defeat confirmed. Room complete." });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Admin Lobbies Controllers
// ============================================================

const getPendingLobbies = async (req, res, next) => {
  try {
    const lobbies = await LobbyMatch.find({ status: "pending", screenshot: { $ne: "" } });
    res.json({ success: true, lobbies });
  } catch (error) {
    next(error);
  }
};

const resolveLobby = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "approve" or "reject"

    const match = await LobbyMatch.findById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: "Lobby match not found" });
    }

    if (action === "approve") {
      const winnerName = match.winner;
      const winnerUser = await User.findOne({ username: winnerName });

      if (winnerUser) {
        const prize = Math.round(match.amount * 1.8);
        const wallet = await Wallet.findOne({ user: winnerUser._id });

        if (wallet) {
          const balanceBefore = wallet.balance;
          wallet.balance += prize;
          await wallet.save();

          await Transaction.create({
            user: winnerUser._id,
            type: "game_win",
            amount: prize,
            balanceBefore,
            balanceAfter: wallet.balance,
            status: "completed",
            description: `Admin Approved Win: Lobby Match #${match.lobbyId}`,
          });

          await Notification.create({
            user: winnerUser._id,
            title: "🏆 Victory Claim Approved!",
            message: `Admin verified screenshot for Match #${match.lobbyId}. ₹${prize} credited!`,
            type: "game_result",
            color: "green",
          });
        }
      }
      match.status = "approved";
    } else {
      // Refund both players if rejected or cancel lobby
      const users = [match.creator, match.opponent];
      for (const u of users) {
        if (!u) continue;
        const usr = await User.findOne({ username: u });
        if (usr) {
          const wallet = await Wallet.findOne({ user: usr._id });
          if (wallet) {
            const balanceBefore = wallet.balance;
            wallet.balance += match.amount;
            await wallet.save();

            await Transaction.create({
              user: usr._id,
              type: "refund",
              amount: match.amount,
              balanceBefore,
              balanceAfter: wallet.balance,
              status: "completed",
              description: `Refund: Rejected Victory Claim Lobby #${match.lobbyId}`,
            });
          }
        }
      }
      match.status = "rejected";
    }

    await match.save();
    res.json({ success: true, message: `Match lobby resolved: ${action}` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLobby,
  getActiveLobbies,
  joinLobby,
  setRoomCode,
  claimVictory,
  confirmDefeat,
  getPendingLobbies,
  resolveLobby,
};
