// ============================================================
// ColorVerse Backend - Main Server Entry Point
// ============================================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import configurations
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const gameRoutes = require("./routes/gameRoutes");
const depositRoutes = require("./routes/depositRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const referralRoutes = require("./routes/referralRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Import socket service
const initializeSocket = require("./services/socketService");

// Initialize express app
const app = express();
const server = http.createServer(app);

// ============================================================
// Socket.io Setup
// ============================================================
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowed =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app") ||
        origin === process.env.CLIENT_URL;
      if (allowed) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket service with io instance
initializeSocket(io);

// Make io accessible to routes
app.set("io", io);

// ============================================================
// Security Middleware
// ============================================================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// Rate limiting - general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
});

app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// ============================================================
// CORS Configuration
// ============================================================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app") ||
        origin === process.env.CLIENT_URL;
      if (isAllowed) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ============================================================
// Body Parsing & Sanitization
// ============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize()); // Prevent NoSQL injection

// ============================================================
// Connect to MongoDB
// ============================================================
connectDB();

// ============================================================
// API Routes
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// ============================================================
// Health Check Route
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ColorVerse API is running 🎮",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║      ColorVerse API Server            ║
  ║      Port: ${PORT}                       ║
  ║      Environment: ${process.env.NODE_ENV || "development"}       ║
  ╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

module.exports = { app, io };
