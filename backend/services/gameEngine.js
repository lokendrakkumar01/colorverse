// ============================================================
// Game Engine Service - ColorVerse Platform
// ============================================================
const Game = require("../models/Game");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");

const { GAME_COLORS } = require("../models/Game");

// Game configuration
const GAME_CONFIG = {
  ROUND_DURATION: 30, // seconds
  BETTING_WINDOW: 25, // seconds (5s reserved for processing)
  MIN_BET: 10,
  MAX_BET: 50000,
  WIN_MULTIPLIER: 9, // 9x return (10 colors, house edge ~10%)
  HOUSE_EDGE: 0.1,
  COLORS: GAME_COLORS,
};

let currentGame = null;
let gameTimer = null;
let roundNumber = 0;
let io = null;

// ============================================================
// Initialize Game Engine
// ============================================================
const initGameEngine = async (socketIo) => {
  io = socketIo;

  // Get last round number from DB
  try {
    const lastGame = await Game.findOne().sort({ roundNumber: -1 });
    if (lastGame) {
      roundNumber = lastGame.roundNumber;
    }
  } catch (error) {
    console.error("Error initializing game engine:", error);
  }

  // Start the first round
  await startNewRound();
};

// ============================================================
// Start a New Game Round
// ============================================================
const startNewRound = async () => {
  try {
    roundNumber += 1;
    const period = generatePeriod();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + GAME_CONFIG.ROUND_DURATION * 1000);

    // Create game in DB
    const game = await Game.create({
      roundNumber,
      period,
      startTime,
      endTime,
      duration: GAME_CONFIG.ROUND_DURATION,
      status: "betting",
    });

    currentGame = game;

    console.log(`🎮 Round #${roundNumber} started | Period: ${period}`);

    // Broadcast to all connected clients
    if (io) {
      io.emit("game:new_round", {
        roundNumber,
        period,
        startTime,
        endTime,
        duration: GAME_CONFIG.ROUND_DURATION,
        status: "betting",
      });
    }

    // Set timer for round end
    gameTimer = setTimeout(async () => {
      await endRound(game._id);
    }, GAME_CONFIG.ROUND_DURATION * 1000);

    // Emit countdown every second
    let timeLeft = GAME_CONFIG.ROUND_DURATION;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (io) {
        io.emit("game:countdown", {
          timeLeft,
          roundNumber,
          period,
          bettingOpen: timeLeft > GAME_CONFIG.ROUND_DURATION - GAME_CONFIG.BETTING_WINDOW,
        });
      }
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  } catch (error) {
    console.error("Error starting new round:", error);
    // Retry after 5 seconds
    setTimeout(startNewRound, 5000);
  }
};

// ============================================================
// End Game Round and Determine Result
// ============================================================
const endRound = async (gameId) => {
  try {
    const game = await Game.findById(gameId).populate("bets.user", "username email");
    if (!game || game.status !== "betting") return;

    // Update status to processing
    game.status = "processing";
    await game.save();

    if (io) {
      io.emit("game:processing", { roundNumber: game.roundNumber, period: game.period });
    }

    // Determine winning color
    const winningColor = await determineWinningColor(game);
    game.winningColor = winningColor;

    // Process all bets
    let totalWinAmount = 0;
    const results = [];

    for (const bet of game.bets) {
      const isWin = bet.color === winningColor;
      bet.result = isWin ? "win" : "loss";

      if (isWin) {
        bet.winAmount = bet.amount * GAME_CONFIG.WIN_MULTIPLIER;
        totalWinAmount += bet.winAmount;

        // Credit winner's wallet
        try {
          const wallet = await Wallet.findOne({ user: bet.user._id || bet.user });
          if (wallet) {
            const balanceBefore = wallet.balance;
            wallet.balance += bet.winAmount;
            wallet.totalWon += bet.winAmount;
            await wallet.save();

            // Record transaction
            await Transaction.create({
              user: bet.user._id || bet.user,
              type: "game_win",
              amount: bet.winAmount,
              balanceBefore,
              balanceAfter: wallet.balance,
              status: "completed",
              gameId: game._id,
              description: `Won ₹${bet.winAmount} - Round #${game.roundNumber} (${winningColor})`,
            });

            // Update user stats
            await User.findByIdAndUpdate(bet.user._id || bet.user, {
              $inc: { totalWins: 1, totalGames: 1, totalWinAmount: bet.winAmount },
            });

            // Create notification
            await Notification.create({
              user: bet.user._id || bet.user,
              title: "🏆 You Won!",
              message: `Congratulations! You won ₹${bet.winAmount.toFixed(2)} in Round #${game.roundNumber}`,
              type: "game_result",
              color: "green",
            });
          }
        } catch (walletError) {
          console.error("Error crediting winner:", walletError);
        }
      } else {
        // Record loss transaction
        await Transaction.create({
          user: bet.user._id || bet.user,
          type: "game_loss",
          amount: bet.amount,
          balanceBefore: 0, // Will be updated
          balanceAfter: 0,
          status: "completed",
          gameId: game._id,
          description: `Lost ₹${bet.amount} - Round #${game.roundNumber} (${winningColor} won)`,
        });

        // Update user stats
        await User.findByIdAndUpdate(bet.user._id || bet.user, {
          $inc: { totalLosses: 1, totalGames: 1, totalLossAmount: bet.amount },
        });

        // Create notification
        await Notification.create({
          user: bet.user._id || bet.user,
          title: "Better luck next time!",
          message: `You lost ₹${bet.amount} in Round #${game.roundNumber}. Winning color: ${winningColor}`,
          type: "game_result",
          color: "red",
        });
      }

      results.push({
        userId: bet.user._id || bet.user,
        color: bet.color,
        amount: bet.amount,
        result: bet.result,
        winAmount: bet.winAmount,
      });
    }

    // Update game stats
    game.totalWinAmount = totalWinAmount;
    game.houseProfitLoss = game.totalBetAmount - totalWinAmount;
    game.status = "completed";
    await game.save();

    console.log(`✅ Round #${game.roundNumber} completed | Winner: ${winningColor} | House P/L: ₹${game.houseProfitLoss}`);

    // Broadcast result
    if (io) {
      io.emit("game:result", {
        roundNumber: game.roundNumber,
        period: game.period,
        winningColor,
        totalBetAmount: game.totalBetAmount,
        totalWinAmount,
        houseProfitLoss: game.houseProfitLoss,
        results,
      });
    }

    // Start next round after 3 seconds
    setTimeout(startNewRound, 3000);
  } catch (error) {
    console.error("Error ending round:", error);
    setTimeout(startNewRound, 5000);
  }
};

// ============================================================
// Determine Winning Color (with house edge)
// ============================================================
const determineWinningColor = async (game) => {
  // Calculate color distribution
  const colorAmounts = {};
  GAME_COLORS.forEach((c) => (colorAmounts[c] = 0));

  game.bets.forEach((bet) => {
    colorAmounts[bet.color] = (colorAmounts[bet.color] || 0) + bet.amount;
  });

  // Apply house edge: prefer colors with less bet amount
  const totalBet = game.totalBetAmount;

  if (totalBet === 0) {
    // No bets, random result
    return GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
  }

  // Weight colors inversely by bet amount (house edge)
  const weights = {};
  GAME_COLORS.forEach((color) => {
    const betOnColor = colorAmounts[color] || 0;
    // Colors with less bets get higher probability
    const inverseBetRatio = 1 - betOnColor / (totalBet + 1);
    weights[color] = Math.max(0.05, inverseBetRatio); // Min 5% chance
  });

  // Normalize weights
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const rand = Math.random() * totalWeight;

  let cumulative = 0;
  for (const color of GAME_COLORS) {
    cumulative += weights[color];
    if (rand <= cumulative) {
      return color;
    }
  }

  // Fallback
  return GAME_COLORS[Math.floor(Math.random() * GAME_COLORS.length)];
};

// ============================================================
// Place a Bet
// ============================================================
const placeBet = async (userId, color, amount) => {
  if (!currentGame || currentGame.status !== "betting") {
    throw new Error("No active betting round");
  }

  // Check betting window
  const now = new Date();
  const timeLeft = (currentGame.endTime - now) / 1000;
  if (timeLeft < GAME_CONFIG.ROUND_DURATION - GAME_CONFIG.BETTING_WINDOW) {
    throw new Error("Betting window has closed for this round");
  }

  // Validate amount
  if (amount < GAME_CONFIG.MIN_BET) {
    throw new Error(`Minimum bet amount is ₹${GAME_CONFIG.MIN_BET}`);
  }
  if (amount > GAME_CONFIG.MAX_BET) {
    throw new Error(`Maximum bet amount is ₹${GAME_CONFIG.MAX_BET}`);
  }

  // Check if user already bet in this round
  const existingBet = currentGame.bets.find(
    (b) => b.user.toString() === userId.toString()
  );
  if (existingBet) {
    throw new Error("You have already placed a bet in this round");
  }

  // Check wallet balance, free trial, and global free play status
  const user = await User.findById(userId);
  const isFreeTrial = user && (Date.now() - new Date(user.createdAt).getTime()) < 10 * 60 * 1000;
  
  const modeSetting = await SystemSetting.findOne({ key: "gameMode" });
  const isGlobalFree = modeSetting && modeSetting.value === "free";
  const isFree = isFreeTrial || isGlobalFree;

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (!isFree && wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  // Debit wallet (skip if free play)
  const balanceBefore = wallet.balance;
  if (!isFree) {
    wallet.balance -= amount;
    wallet.totalLost += amount;
    await wallet.save();
  }

  // Record bet transaction
  await Transaction.create({
    user: userId,
    type: "game_bet",
    amount: isFree ? 0 : amount,
    balanceBefore,
    balanceAfter: wallet.balance,
    status: "completed",
    gameId: currentGame._id,
    description: `${isGlobalFree ? "[GLOBAL FREE PLAY] " : isFreeTrial ? "[FREE TRIAL] " : ""}Bet ₹${amount} on ${color} - Round #${currentGame.roundNumber}`,
  });

  // Update user stats
  await User.findByIdAndUpdate(userId, {
    $inc: { totalBetAmount: amount },
  });

  // Add bet to game
  const game = await Game.findById(currentGame._id);
  game.bets.push({
    user: userId,
    color,
    amount,
    multiplier: GAME_CONFIG.WIN_MULTIPLIER,
  });
  game.totalBetAmount += amount;
  game.totalPlayers = game.bets.length;

  // Update color distribution
  const currentDist = game.colorDistribution.get(color) || 0;
  game.colorDistribution.set(color, currentDist + amount);

  await game.save();
  currentGame = game;

  // Broadcast updated bet distribution
  if (io) {
    io.emit("game:bet_placed", {
      roundNumber: game.roundNumber,
      totalBetAmount: game.totalBetAmount,
      totalPlayers: game.totalPlayers,
      colorDistribution: Object.fromEntries(game.colorDistribution),
    });
  }

  return {
    success: true,
    bet: { color, amount, multiplier: GAME_CONFIG.WIN_MULTIPLIER },
    walletBalance: wallet.balance,
    potentialWin: amount * GAME_CONFIG.WIN_MULTIPLIER,
  };
};

// ============================================================
// Get Current Game State
// ============================================================
const getCurrentGame = () => {
  if (!currentGame) return null;

  const now = new Date();
  const timeLeft = Math.max(0, Math.floor((currentGame.endTime - now) / 1000));

  return {
    roundNumber: currentGame.roundNumber,
    period: currentGame.period,
    startTime: currentGame.startTime,
    endTime: currentGame.endTime,
    timeLeft,
    status: currentGame.status,
    totalBetAmount: currentGame.totalBetAmount,
    totalPlayers: currentGame.totalPlayers,
    colorDistribution: currentGame.colorDistribution
      ? Object.fromEntries(currentGame.colorDistribution)
      : {},
  };
};

// ============================================================
// Generate Period ID (YYYYMMDDXXX)
// ============================================================
const generatePeriod = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const num = String(roundNumber).padStart(6, "0");
  return `${date}${num}`;
};

module.exports = {
  initGameEngine,
  placeBet,
  getCurrentGame,
  GAME_CONFIG,
};
