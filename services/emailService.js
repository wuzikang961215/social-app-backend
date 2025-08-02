const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Check if email is configured
    this.isConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (this.isConfigured) {
      // Create transporter with Gmail or other email service
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      console.warn('⚠️  Email service not configured. Running in development mode.');
      console.warn('⚠️  To enable email sending, please configure EMAIL_USER and EMAIL_PASS in .env file');
    }

    this.FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com';
  }

  async send(msg) {
    try {
      if (!this.isConfigured) {
        // In development mode, just log the email
        console.log('📧 Development Mode - Email would be sent:');
        console.log('To:', msg.to);
        console.log('Subject:', msg.subject);
        console.log('Text:', msg.text?.substring(0, 100) + '...');
        return { messageId: 'dev-mode-' + Date.now() };
      }
      
      const info = await this.transporter.sendMail(msg);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to, userName, resetUrl) {
    const msg = {
      to,
      from: this.FROM_EMAIL,
      subject: '🔐 重置您的密码',
      text: `您好 ${userName}，\n\n您请求重置密码。请点击以下链接重置您的密码：\n\n${resetUrl}\n\n此链接将在1小时后失效。\n\n如果您没有请求重置密码，请忽略此邮件。`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔐 重置您的密码</h2>
          <p>您好 ${userName}，</p>
          <p>您请求重置密码。请点击下面的按钮重置您的密码：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">重置密码</a>
          </div>
          <p style="color: #666; font-size: 14px;">或复制以下链接到浏览器：</p>
          <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">此链接将在1小时后失效。</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">如果您没有请求重置密码，请忽略此邮件。</p>
        </div>
      `
    };

    return this.send(msg);
  }

  async sendWelcomeEmail(to, userName) {
    const msg = {
      to,
      from: this.FROM_EMAIL,
      subject: '🎉 欢迎加入社交活动平台！',
      text: `欢迎 ${userName}！\n\n感谢您注册我们的社交活动平台。在这里您可以：\n- 参加各种有趣的活动\n- 认识志同道合的朋友\n- 组织自己的活动\n\n开始探索吧！`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 欢迎加入社交活动平台！</h2>
          <p>欢迎 ${userName}！</p>
          <p>感谢您注册我们的社交活动平台。在这里您可以：</p>
          <ul>
            <li>参加各种有趣的活动</li>
            <li>认识志同道合的朋友</li>
            <li>组织自己的活动</li>
          </ul>
          <p>开始探索吧！</p>
        </div>
      `
    };

    return this.send(msg);
  }

  async sendEventApprovalEmail(to, userName, eventTitle, eventTime, eventLocation) {
    const msg = {
      to,
      from: this.FROM_EMAIL,
      subject: '🎉 活动申请已通过！',
      text: `恭喜 ${userName}！你申请参加的活动「${eventTitle}」已通过审核。\n\n活动时间：${eventTime}\n活动地点：${eventLocation}\n\n期待在活动中见到你！`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 活动申请已通过！</h2>
          <p>恭喜 ${userName}！</p>
          <p>你申请参加的活动「<strong>${eventTitle}</strong>」已通过审核。</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>活动时间：</strong>${eventTime}</p>
            <p><strong>活动地点：</strong>${eventLocation}</p>
          </div>
          <p>期待在活动中见到你！</p>
        </div>
      `
    };

    return this.send(msg);
  }
}

module.exports = new EmailService();