const Notification = require('../models/Notification');

class NotificationService {
  // Get notifications for a user
  async getNotifications(userId, { limit = 20, skip = 0, unreadOnly = false } = {}) {
    const query = { recipient: userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification
      .find(query)
      .populate('sender', 'username')
      .populate('eventId', 'title location startTime')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return notifications;
  }

  // Get unread count
  async getUnreadCount(userId) {
    return Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });
  }

  // Mark notifications as read
  async markAsRead(userId, notificationIds) {
    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        recipient: userId
      },
      { read: true }
    );
    return result;
  }

  // Mark all as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    return result;
  }

  // Delete a notification
  async deleteNotification(userId, notificationId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    return result;
  }

  // Create a notification (used internally)
  async createNotification(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  }

  // Create bulk notifications for multiple recipients
  async createBulkNotifications(recipientIds, message, type, relatedData = {}) {
    const notifications = recipientIds.map(recipientId => ({
      recipient: recipientId,
      message,
      type,
      title: relatedData.title || '活动更新通知', // Default title if not provided
      ...relatedData,
      read: false
    }));

    const result = await Notification.insertMany(notifications);
    return result;
  }
}

module.exports = new NotificationService();