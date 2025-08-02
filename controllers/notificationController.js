const notificationService = require('../services/notificationService');

class NotificationController {
  // Get user's notifications
  async getNotifications(req, res, next) {
    try {
      const { limit = 20, skip = 0, unreadOnly = false } = req.query;
      const notifications = await notificationService.getNotifications(
        req.user.id,
        { 
          limit: parseInt(limit), 
          skip: parseInt(skip), 
          unreadOnly: unreadOnly === 'true' 
        }
      );
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  // Get unread count
  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  // Mark specific notifications as read
  async markAsRead(req, res, next) {
    try {
      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ message: 'notificationIds must be an array' });
      }
      
      const result = await notificationService.markAsRead(req.user.id, notificationIds);
      res.json({ message: '标记成功', modifiedCount: result.modifiedCount });
    } catch (error) {
      next(error);
    }
  }

  // Mark all as read
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.json({ message: '全部标记为已读', modifiedCount: result.modifiedCount });
    } catch (error) {
      next(error);
    }
  }

  // Delete a notification
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await notificationService.deleteNotification(req.user.id, id);
      
      if (!result) {
        return res.status(404).json({ message: '通知未找到' });
      }
      
      res.json({ message: '删除成功' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();