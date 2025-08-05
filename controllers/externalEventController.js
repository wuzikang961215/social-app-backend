const ExternalEvent = require('../models/ExternalEvent');

// Check if user is admin
const isAdmin = (userId) => {
  // Replace with your admin user ID
  return userId === '67ece9e577fb0dd27c504083';
};

// Get all external events
exports.getEvents = async (req, res) => {
  try {
    const now = new Date();
    
    // Find events that haven't passed yet
    const events = await ExternalEvent.find({
      time: { $gte: now } // Only future events
    })
      .sort({ time: 1 }) // Sort by time ascending
      .lean();
    
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取活动失败'
    });
  }
};

// Create new event (admin only)
exports.createEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: '无权执行此操作'
      });
    }

    const { title, description, time, location, link } = req.body;

    const event = new ExternalEvent({
      title,
      description,
      time: new Date(time),
      location,
      link,
      createdBy: req.user.id
    });

    await event.save();

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建活动失败',
      error: error.message
    });
  }
};

// Update event (admin only)
exports.updateEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: '无权执行此操作'
      });
    }

    const { id } = req.params;
    const { title, description, time, location, link } = req.body;

    const event = await ExternalEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (time) event.time = new Date(time);
    if (location) event.location = location;
    if (link) event.link = link;

    await event.save();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新活动失败',
      error: error.message
    });
  }
};

// Delete event (admin only)
exports.deleteEvent = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: '无权执行此操作'
      });
    }

    const { id } = req.params;

    const event = await ExternalEvent.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '活动删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除活动失败',
      error: error.message
    });
  }
};