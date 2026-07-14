// ============================================================
// Socket.io Service - ColorVerse Platform
// ============================================================
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const { initGameEngine, getCurrentGame } = require("./gameEngine");

// Keep last 50 chat messages in memory
const chatHistory = [];

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

    // Send chat history to new connection
    socket.emit("chat:history", chatHistory);

    // ============================================================
    // Game Events
    // ============================================================

    // Client requests current game state
    socket.on("game:get_state", () => {
      const gameState = getCurrentGame();
      socket.emit("game:state", gameState);
    });

    // ============================================================
    // Chat Events
    // ============================================================
    socket.on("chat:message", (text) => {
      if (!socket.user) return; // Must be authenticated to chat
      
      const message = {
        id: String(Date.now()) + Math.random().toString(36).substring(2, 5),
        username: socket.user.username,
        text: text.slice(0, 300), // Max 300 chars
        time: new Date().toISOString(),
        avatar: socket.user.avatar || "",
      };

      // Add to history
      chatHistory.push(message);
      if (chatHistory.length > 50) chatHistory.shift();

      // Broadcast to everyone
      io.emit("chat:message", message);
    });

    // ============================================================
    // Private Direct Messaging Events
    // ============================================================
    socket.on("chat:get_private_history", async ({ receiverUsername }) => {
      if (!socket.user) return;
      try {
        const receiver = await User.findOne({ username: receiverUsername });
        if (!receiver) return;

        const messages = await ChatMessage.find({
          $or: [
            { sender: socket.user._id, receiver: receiver._id },
            { sender: receiver._id, receiver: socket.user._id }
          ]
        })
          .sort({ createdAt: 1 })
          .limit(50);

        socket.emit("chat:private_history", {
          receiverUsername,
          messages: messages.map(m => ({
            id: m._id,
            sender: m.sender.toString() === socket.user._id.toString() ? socket.user.username : receiverUsername,
            text: m.text,
            image: m.image,
            time: m.createdAt
          }))
        });
      } catch (err) {
        console.error("Error getting chat history:", err);
      }
    });

    socket.on("chat:send_private_message", async ({ receiverUsername, text, image }) => {
      if (!socket.user) return;
      try {
        const receiver = await User.findOne({ username: receiverUsername });
        if (!receiver) return;

        const newMsg = await ChatMessage.create({
          sender: socket.user._id,
          receiver: receiver._id,
          text: text || "",
          image: image || "",
        });

        const formattedMsg = {
          id: newMsg._id,
          sender: socket.user.username,
          text: newMsg.text,
          image: newMsg.image,
          time: newMsg.createdAt
        };

        // Emit to sender room
        io.to(`user:${socket.user._id}`).emit("chat:private_receive", {
          chatPartner: receiverUsername,
          message: formattedMsg
        });

        // Emit to receiver room
        io.to(`user:${receiver._id}`).emit("chat:private_receive", {
          chatPartner: socket.user.username,
          message: formattedMsg
        });
      } catch (err) {
        console.error("Error sending private message:", err);
      }
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
