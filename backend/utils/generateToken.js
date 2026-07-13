// ============================================================
// JWT Token Generator Utility
// ============================================================
const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for a user
 * @param {string} id - User MongoDB ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (id, role = "user") => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = generateToken;
