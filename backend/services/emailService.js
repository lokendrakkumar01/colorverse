// ============================================================
// Email Service - ColorVerse Platform
// ============================================================
const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ============================================================
// Email Templates
// ============================================================

const emailTemplates = {
  // Base HTML wrapper
  baseTemplate: (content) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0d0d1a; color: #e2e8f0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { color: white; font-size: 28px; letter-spacing: 2px; }
        .header p { color: rgba(255,255,255,0.8); margin-top: 5px; }
        .body { background: #1a1a2e; padding: 30px; border-radius: 0 0 12px 12px; }
        .card { background: #16213e; border-radius: 8px; padding: 20px; margin: 15px 0; border: 1px solid #2d2d4e; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        .highlight { color: #a78bfa; font-weight: bold; }
        .amount { color: #34d399; font-size: 24px; font-weight: bold; }
        .otp { font-size: 36px; letter-spacing: 8px; color: #a78bfa; font-weight: bold; text-align: center; padding: 20px; background: #0d0d1a; border-radius: 8px; border: 2px dashed #7c3aed; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 ColorVerse</h1>
          <p>Your Premium Gaming Platform</p>
        </div>
        <div class="body">
          ${content}
        </div>
        <div class="footer">
          <p>© 2024 ColorVerse. All rights reserved.</p>
          <p>This email was sent from a no-reply address. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Email Verification
  emailVerification: (username, verificationUrl) => ({
    subject: "Verify Your ColorVerse Account 🎮",
    html: emailTemplates.baseTemplate(`
      <h2>Welcome to ColorVerse, <span class="highlight">${username}</span>! 🎉</h2>
      <p style="margin-top:15px;color:#94a3b8;">You're one step away from joining the ultimate color prediction gaming platform.</p>
      <div class="card">
        <p>Click the button below to verify your email address and activate your account.</p>
        <a href="${verificationUrl}" class="btn">Verify Email Address</a>
        <p style="color:#64748b;font-size:12px;">This link expires in 24 hours. If you didn't create this account, ignore this email.</p>
      </div>
    `),
  }),

  // Password Reset
  passwordReset: (username, resetUrl) => ({
    subject: "Reset Your ColorVerse Password 🔐",
    html: emailTemplates.baseTemplate(`
      <h2>Password Reset Request</h2>
      <p style="margin-top:15px;color:#94a3b8;">Hi <span class="highlight">${username}</span>, we received a request to reset your password.</p>
      <div class="card">
        <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
        <p style="color:#64748b;font-size:12px;margin-top:15px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `),
  }),

  // Deposit Confirmed
  depositConfirmed: (username, amount, transactionId) => ({
    subject: "Deposit Confirmed ✅ - ColorVerse",
    html: emailTemplates.baseTemplate(`
      <h2>Deposit Confirmed! 🎉</h2>
      <p style="margin-top:15px;color:#94a3b8;">Hi <span class="highlight">${username}</span>, your deposit has been processed.</p>
      <div class="card">
        <p>Amount Deposited:</p>
        <p class="amount">₹${amount.toLocaleString()}</p>
        <p style="color:#64748b;margin-top:10px;">Transaction ID: <span class="highlight">${transactionId}</span></p>
        <p style="color:#64748b;margin-top:5px;">Your wallet has been credited. Happy Playing! 🎮</p>
      </div>
    `),
  }),

  // Withdrawal Approved
  withdrawalApproved: (username, amount, reference) => ({
    subject: "Withdrawal Approved ✅ - ColorVerse",
    html: emailTemplates.baseTemplate(`
      <h2>Withdrawal Approved! 💸</h2>
      <p style="margin-top:15px;color:#94a3b8;">Hi <span class="highlight">${username}</span>, your withdrawal request has been approved.</p>
      <div class="card">
        <p>Withdrawal Amount:</p>
        <p class="amount">₹${amount.toLocaleString()}</p>
        <p style="color:#64748b;margin-top:10px;">Reference: <span class="highlight">${reference}</span></p>
        <p style="color:#64748b;margin-top:5px;">Funds will be credited to your account within 1-3 business days.</p>
      </div>
    `),
  }),

  // Withdrawal Rejected
  withdrawalRejected: (username, amount, reason) => ({
    subject: "Withdrawal Rejected ❌ - ColorVerse",
    html: emailTemplates.baseTemplate(`
      <h2>Withdrawal Update</h2>
      <p style="margin-top:15px;color:#94a3b8;">Hi <span class="highlight">${username}</span>, unfortunately your withdrawal has been rejected.</p>
      <div class="card">
        <p>Amount: <span class="highlight">₹${amount.toLocaleString()}</span></p>
        <p style="margin-top:10px;color:#f87171;">Reason: ${reason || "Please contact support for more information."}</p>
        <p style="color:#64748b;margin-top:10px;">The amount has been refunded to your wallet. Contact support if you need help.</p>
      </div>
    `),
  }),

  // Game Win
  gameBigWin: (username, amount, color) => ({
    subject: "🏆 Big Win! - ColorVerse",
    html: emailTemplates.baseTemplate(`
      <h2>You Won! 🏆🎉</h2>
      <p style="margin-top:15px;color:#94a3b8;">Congratulations <span class="highlight">${username}</span>!</p>
      <div class="card">
        <p>Winning Color: <span style="font-size:20px;">${color?.toUpperCase()}</span></p>
        <p>Amount Won:</p>
        <p class="amount">₹${amount.toLocaleString()}</p>
        <p style="color:#64748b;margin-top:10px;">Keep playing to win more! 🎮</p>
      </div>
    `),
  }),

  // Welcome Email
  welcome: (username) => ({
    subject: "Welcome to ColorVerse! 🎮",
    html: emailTemplates.baseTemplate(`
      <h2>Welcome aboard, <span class="highlight">${username}</span>! 🚀</h2>
      <p style="margin-top:15px;color:#94a3b8;">You've successfully verified your account. Get ready for the ultimate gaming experience!</p>
      <div class="card">
        <p>Here's what you can do:</p>
        <ul style="margin-top:10px;padding-left:20px;color:#94a3b8;">
          <li>💰 Deposit funds to your wallet</li>
          <li>🎨 Predict colors and win big</li>
          <li>👥 Refer friends and earn bonuses</li>
          <li>🏆 Compete on the global leaderboard</li>
        </ul>
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Start Playing Now</a>
      </div>
    `),
  }),
};

// ============================================================
// Send Email Function
// ============================================================
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ColorVerse 🎮" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

// ============================================================
// Exported Functions
// ============================================================
module.exports = {
  sendEmail,
  emailTemplates,

  // Convenience functions
  sendVerificationEmail: async (user, verificationUrl) => {
    const { subject, html } = emailTemplates.emailVerification(user.username, verificationUrl);
    return sendEmail({ to: user.email, subject, html });
  },

  sendPasswordResetEmail: async (user, resetUrl) => {
    const { subject, html } = emailTemplates.passwordReset(user.username, resetUrl);
    return sendEmail({ to: user.email, subject, html });
  },

  sendDepositConfirmedEmail: async (user, amount, transactionId) => {
    const { subject, html } = emailTemplates.depositConfirmed(user.username, amount, transactionId);
    return sendEmail({ to: user.email, subject, html });
  },

  sendWithdrawalApprovedEmail: async (user, amount, reference) => {
    const { subject, html } = emailTemplates.withdrawalApproved(user.username, amount, reference);
    return sendEmail({ to: user.email, subject, html });
  },

  sendWithdrawalRejectedEmail: async (user, amount, reason) => {
    const { subject, html } = emailTemplates.withdrawalRejected(user.username, amount, reason);
    return sendEmail({ to: user.email, subject, html });
  },

  sendWelcomeEmail: async (user) => {
    const { subject, html } = emailTemplates.welcome(user.username);
    return sendEmail({ to: user.email, subject, html });
  },
};
