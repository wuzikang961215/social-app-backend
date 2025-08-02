const authService = require("../services/authService");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const bcrypt = require("bcryptjs");
const securityConfig = require("../config/security");

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { token, user } = await authService.login(email, password);
      res.json({ token, user });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async requestPasswordReset(req, res) {
    try {
      console.log('Password reset request received:', req.body);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "请提供邮箱地址" });
      }
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: "如果该邮箱已注册，重置链接已发送到您的邮箱" });
      }

      // Delete any existing reset tokens for this user
      await PasswordReset.deleteMany({ userId: user._id });

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Save hashed token to database
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      await PasswordReset.create({
        userId: user._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordResetEmail(user.email, user.username, resetUrl);
      
      // Log reset URL in development for testing
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('\n🔗 Password Reset URL (Development Mode):');
        console.log(resetUrl);
        console.log('\n');
      }

      res.json({ message: "如果该邮箱已注册，重置链接已发送到您的邮箱" });
    } catch (error) {
      console.error('Password reset request error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: "发送重置邮件失败，请稍后再试" });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Hash the token to match stored version
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const resetRecord = await PasswordReset.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() }
      });

      if (!resetRecord) {
        return res.status(400).json({ message: "无效或已过期的重置链接" });
      }

      // Update user password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(resetRecord.userId, {
        password: hashedPassword
      });

      // Delete used token
      await PasswordReset.deleteOne({ _id: resetRecord._id });

      res.json({ message: "密码重置成功" });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: "密码重置失败，请稍后再试" });
    }
  }
}

module.exports = new AuthController();
