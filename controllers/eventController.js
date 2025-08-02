const eventService = require('../services/eventService');

class EventController {
  // Get all events
  async getAllEvents(req, res, next) {
    try {
      const { category } = req.query;
      const events = await eventService.findEvents(category);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Get manageable events
  async getManageableEvents(req, res, next) {
    try {
      const events = await eventService.findManageableEvents(req.user.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Get created events
  async getCreatedEvents(req, res, next) {
    try {
      const events = await eventService.findEventsByCreator(req.user.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Get participated events
  async getParticipatedEvents(req, res, next) {
    try {
      const events = await eventService.findParticipatedEvents(req.user.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Get single event
  async getEventById(req, res, next) {
    try {
      const event = await eventService.findEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: '活动未找到' });
      }
      res.json(event);
    } catch (error) {
      next(error);
    }
  }

  // Create event
  async createEvent(req, res, next) {
    try {
      const eventData = {
        ...req.body,
        creator: req.user.id
      };
      const newEvent = await eventService.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      next(error);
    }
  }

  // Update event
  async updateEvent(req, res, next) {
    try {
      const updatedEvent = await eventService.updateEvent(req.params.id, req.body, req.user.id);
      res.json(updatedEvent);
    } catch (error) {
      next(error);
    }
  }

  // Delete event
  async deleteEvent(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '仅管理员可删除活动' });
      }
      const event = await eventService.deleteEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: '活动未找到' });
      }
      res.json({ message: 'Event deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Join event
  async joinEvent(req, res, next) {
    try {
      const event = await eventService.joinEvent(req.params.id, req.user.id);
      res.json({ message: '已成功报名，等待发起人审核', event });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Leave event
  async leaveEvent(req, res, next) {
    try {
      const event = await eventService.leaveEvent(req.params.id, req.user.id);
      res.json({ message: '已取消报名', event });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Review participant
  async reviewParticipant(req, res, next) {
    try {
      const { userId, approve } = req.body;
      const event = await eventService.reviewParticipant(req.params.id, req.user.id, userId, approve);
      res.json({ message: '审核完成', event });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Mark attendance
  async markAttendance(req, res, next) {
    try {
      const { userId, attended } = req.body;
      const event = await eventService.markAttendance(req.params.id, req.user.id, userId, attended);
      res.json({ 
        message: attended ? '签到成功' : '已标记为 no-show', 
        event 
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Request cancellation
  async requestCancellation(req, res, next) {
    try {
      const event = await eventService.requestCancellation(req.params.id, req.user.id);
      res.json({ message: '已申请取消，请等待审核', event });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Review cancellation
  async reviewCancellation(req, res, next) {
    try {
      const { userId, approve } = req.body;
      const event = await eventService.reviewCancellation(req.params.id, req.user.id, userId, approve);
      res.json({ 
        message: approve ? '已同意取消申请' : '已拒绝取消申请', 
        event 
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new EventController();