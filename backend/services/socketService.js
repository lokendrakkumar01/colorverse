// ============================================================
// Socket.io Service - ColorVerse Platform
// ============================================================
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { initGameEngine, getCurrentGame } = require("./gameEngine");

const initializeSocket = (io) => {
  // Middleware: Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          socket.user = user;
        }
      }
      next();
    } catch {
      // Allow unauthenticated connections (for public game data)
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?._id?.toString() || "anonymous";
    console.log(`🔌 Client connected: ${socket.id} (User: ${userId})`);

    // Join user's personal room for targeted events
    if (socket.user) {
      socket.join(`user:${userId}`);
    }

    // Send current game state on connection
    const currentGame = getCurrentGame();
    if (currentGame) {
      socket.emit("game:state", currentGame);
    }

    // ============================================================
    // Game Events
    // ============================================================

    // Client requests current game state
    socket.on("game:get_state", () => {
      const gameState = getCurrentGame();
      socket.emit("game:state", gameState);
    });

    // ============================================================
    // Admin Events
    // ============================================================

    // Admin joins admin room
    socket.on("admin:join", () => {
      if (socket.user?.role === "admin") {
        socket.join("admin");
        socket.emit("admin:joined", { message: "Joined admin room" });
      }
    });

    // ============================================================
    // Disconnect
    // ============================================================
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    // ============================================================
    // Error Handling
    // ============================================================
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Initialize the game engine with io
  initGameEngine(io);

  console.log("✅ Socket.io initialized");
};

// ============================================================
// Emit to a specific user
// ============================================================
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

// ============================================================
// Emit to all admins
// ============================================================
const emitToAdmins = (io, event, data) => {
  io.to("admin").emit(event, data);
};

module.exports = initializeSocket;
module.exports.emitToUser = emitToUser;
module.exports.emitToAdmins = emitToAdmins;
