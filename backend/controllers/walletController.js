// ============================================================
// Wallet Controller - ColorVerse Platform
// ============================================================
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// ============================================================
// @route   GET /api/wallet
// @access  Private
// ============================================================
const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    res.json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @route   GET /api/wallet/transactions
// @access  Private
// ============================================================
const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const status = req.query.status;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    // Calculate summary
    const summary = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      transactions,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallet,
  getTransactions,
};
