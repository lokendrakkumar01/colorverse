// ============================================================
// User Routes
// ============================================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Get user profile
router.get("/profile", protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update profile
router.put("/profile", protect, async (req, res, next) => {
  try {
    const { username, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) {
        return res.status(409).json({ success: false, message: "Username already taken" });
      }
      user.username = username;
    }
    if (phone) user.phone = phone;
    await user.save();

    res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put("/change-password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

// Get notifications
router.get("/notifications", protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch("/notifications/:id/read", protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch("/notifications/read-all", protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
