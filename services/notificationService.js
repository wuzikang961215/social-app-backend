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

  // Create bulk notifications for multiple recipients with personalization
  async createBulkNotifications(recipientIds, message, type, relatedData = {}) {
    const BATCH_SIZE = 100; // Process users in batches to avoid memory issues
    const User = require('../models/User');
    const notifications = [];
    
    // Process recipients in batches for scalability
    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batchIds = recipientIds.slice(i, i + BATCH_SIZE);
      
      // Fetch user names for this batch only
      const users = await User.find(
        { _id: { $in: batchIds } }, 
        'username',
        { lean: true } // Use lean for better performance
      );
      
      const userMap = new Map(
        users.map(user => [user._id.toString(), user.username])
      );
      
      // Create notifications for this batch
      const batchNotifications = batchIds.map(recipientId => {
        const userName = userMap.get(recipientId.toString()) || '朋友';
        // Add personalization to the message
        const personalizedMessage = `${userName}，${message}`;
        
        return {
          recipient: recipientId,
          message: personalizedMessage,
          type,
          title: relatedData.title || '活动更新通知',
          eventId: relatedData.eventId,
          metadata: {
            ...relatedData.metadata,
            userName
          },
          read: false
        };
      });
      
      notifications.push(...batchNotifications);
    }
    
    // Insert all notifications in batches for better performance
    const results = [];
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const result = await Notification.insertMany(batch, { ordered: false });
      results.push(...result);
    }
    
    return results;
  }
}

module.exports = new NotificationService();