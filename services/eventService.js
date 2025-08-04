const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { formatToSydneyString, hasEventExpired, formatToHumanReadable } = require('../utils/dateUtils');


class EventService {
  // Find events with optional category filter
  async findEvents(category = null) {
    const filter = category ? { category } : {};
    
    // Only get non-expired events and limit to 50 most recent
    const events = await Event.find({ ...filter, expired: false })
      .select('-__v')
      .populate('participants.user', 'username')  // Only username needed
      .populate('creator', 'username')  // Only username needed
      .sort({ startTime: 1 })  // Sort by start time ascending
      .limit(50)  // Limit to 50 events
      .lean()
      .exec();
    
    // Transform _id to id for each event when using lean()
    return events.map(event => ({
      ...event,
      id: event._id.toString(),
      _id: undefined,
      creator: event.creator ? {
        ...event.creator,
        id: event.creator._id ? event.creator._id.toString() : event.creator.id,
        _id: undefined
      } : null,
      participants: event.participants?.map(p => ({
        ...p,
        user: p.user ? {
          ...p.user,
          id: p.user._id ? p.user._id.toString() : p.user.id,
          _id: undefined
        } : p.user
      })) || []
    }));
  }

  // Find manageable events for a user
  async findManageableEvents(userId) {
    const events = await Event.find({ creator: userId })
      .populate('participants.user', 'username idealBuddy whyJoin interests mbti')
      .populate('creator', 'username email');

    return events
      .map(event => {
        const relevantParticipants = event.participants.filter(p =>
          ['pending', 'approved'].includes(p.status)
        );
        return relevantParticipants.length ? {
          ...event.toJSON(),
          participants: relevantParticipants,
        } : null;
      })
      .filter(Boolean);
  }

  // Find events created by user
  async findEventsByCreator(userId) {
    return Event.find({ creator: userId })
      .populate('participants.user', 'username idealBuddy whyJoin interests mbti')
      .populate('creator', 'username email');
  }

  // Find participated events
  async findParticipatedEvents(userId) {
    const events = await Event.find({
      'participants.user': userId
    })
      .populate('participants.user', 'username idealBuddy whyJoin interests mbti')
      .populate('creator', 'username email');

    return events
      .map(event => {
        const participant = event.participants.find(
          p => p.user.id === userId || p.user._id?.toString() === userId
        );
        
        const isParticipating = participant && !['cancelled'].includes(participant.status);
        return isParticipating ? event.toJSON() : null;
      })
      .filter(Boolean);
  }

  // Get single event
  async findEventById(eventId) {
    return Event.findById(eventId)
      .populate('participants.user', 'username email')
      .populate('creator', 'username email');
  }

  async createEvent(eventData) {
    // Ensure startTime is in consistent Sydney format
    const formattedData = {
      ...eventData,
      startTime: formatToSydneyString(eventData.startTime)
    };
    const newEvent = new Event(formattedData);
    return await newEvent.save();
  }  

  // Update event
  async updateEvent(eventId, updateData, userId) {
    console.log('Updating event:', { eventId, updateData, userId });
    
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');
    
    // Check if user is the creator
    if (event.creator.toString() !== userId) {
      throw new Error('只有活动创建者可以修改活动信息');
    }
    
    // Track if time or location changed for notifications
    const timeChanged = updateData.startTime && updateData.startTime !== event.startTime;
    const locationChanged = updateData.location && updateData.location !== event.location;
    
    // If maxParticipants is being updated, ensure it's not less than approved count
    if (updateData.maxParticipants) {
      const approvedCount = event.participants.filter(p => p.status === 'approved').length;
      if (updateData.maxParticipants < approvedCount) {
        throw new Error(`活动人数不能少于已通过的人数 (${approvedCount}人)`);
      }
    }
    
    // Format startTime if provided
    if (updateData.startTime) {
      updateData.startTime = formatToSydneyString(updateData.startTime);
    }
    
    // Only allow updating specific fields
    const allowedFields = ['title', 'location', 'startTime', 'durationMinutes', 'description', 'maxParticipants', 'category', 'tags'];
    const filteredUpdate = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    });
    
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      filteredUpdate,
      { new: true, runValidators: true }
    ).populate('creator', 'username');
    
    // Check if event should be expired based on new time
    if (updateData.startTime || updateData.durationMinutes) {
      const shouldBeExpired = hasEventExpired(updatedEvent.startTime, updatedEvent.durationMinutes);
      if (shouldBeExpired !== updatedEvent.expired) {
        updatedEvent.expired = shouldBeExpired;
        await updatedEvent.save();
      }
    }
    
    // Send notifications if time or location changed
    if ((timeChanged || locationChanged) && event.participants.length > 0) {
      try {
        const notificationService = require('./notificationService');
        // Notify both approved and pending participants
        const participantsToNotify = event.participants
          .filter(p => p.status === 'approved' || p.status === 'pending')
          .map(p => p.user);
        
        if (participantsToNotify.length > 0) {
          let message = `活动「${event.title}」`;
          const metadata = {
            eventTitle: event.title
          };
          
          if (timeChanged && locationChanged) {
            message += `的时间已更新为 ${formatToHumanReadable(updateData.startTime)}，地点已更新为 ${updateData.location}`;
            metadata.eventTime = formatToSydneyString(updateData.startTime);
            metadata.eventLocation = updateData.location;
          } else if (timeChanged) {
            message += `的时间已更新为 ${formatToHumanReadable(updateData.startTime)}`;
            metadata.eventTime = formatToSydneyString(updateData.startTime);
          } else if (locationChanged) {
            message += `的地点已更新为 ${updateData.location}`;
            metadata.eventLocation = updateData.location;
          }
          
          await notificationService.createBulkNotifications(
            participantsToNotify,
            message,
            'event_update',
            { 
              eventId,
              title: '活动信息更新',
              metadata
            }
          );
        }
      } catch (notificationError) {
        console.error('Failed to send update notifications:', notificationError);
        // Don't fail the update if notifications fail
      }
    }
    
    return updatedEvent;
  }

  // Delete event
  async deleteEvent(eventId) {
    return Event.findByIdAndDelete(eventId);
  }
 

  // Join event
  async joinEvent(eventId, userId) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');

    if (event.creator.toString() === userId) {
      throw new Error('你是该活动的发起人，无法报名自己的活动');
    }

    // ✅ 只统计已通过的人数（approved）
    const approvedCount = event.participants.filter(p => p.status === 'approved').length;
    if (approvedCount >= event.maxParticipants) {
      throw new Error('活动名额已满，无法报名');
    }

    const existing = event.participants.find(p => p.user.toString() === userId);
    if (existing) {
      // Check cancel count first for all statuses
      if (existing.cancelCount >= 2) {
        throw new Error('你已取消报名超过2次，不能再次加入');
      }
      
      if (existing.status === 'cancelled' || existing.status === 'denied') {
        // Allow both cancelled and denied users to rejoin
        existing.status = 'pending';
      } else {
        throw new Error('你已经报名过此活动');
      }
    } else {
      event.participants.push({
        user: userId,
        status: 'pending',
        cancelCount: 0
      });
    }

    await event.save();
    return Event.findById(event.id).populate('participants.user');
  }


  // Leave event
  async leaveEvent(eventId, userId) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');

    const participant = event.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error('你未报名该活动');
    
    // Allow pending and denied users to cancel
    if (participant.status !== 'pending' && participant.status !== 'denied') {
      throw new Error('你已被审核，无法取消报名');
    }

    participant.status = 'cancelled';
    participant.cancelCount = (participant.cancelCount || 0) + 1;
    
    await event.save();
    return event;
  }

  // Review participant
  async reviewParticipant(eventId, creatorId, userId, approve) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');
    if (event.creator.toString() !== creatorId) throw new Error('只有活动创建者可以审核');

    const participant = event.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error('未找到该报名用户');
    if (participant.status !== 'pending') throw new Error('只能审核待审核用户');

    participant.status = approve ? 'approved' : 'denied';
    await event.save();
    
    // Only create notification for approval
    if (approve) {
      const [creator, recipient] = await Promise.all([
        User.findById(creatorId),
        User.findById(userId, 'username')
      ]);
      
      if (creator && recipient) {
        await Notification.create({
          recipient: userId,
          sender: creatorId,
          type: 'event_approved',
          title: '活动申请已通过',
          message: `${recipient.username}，恭喜！你申请参加的活动「${event.title}」已通过审核`,
          eventId: event._id,
          metadata: {
            eventTitle: event.title,
            eventTime: event.startTime,
            eventLocation: event.location,
            userName: recipient.username,
            organizerName: creator.username
          }
        });
      }
    }

    return Event.findById(event.id)
      .populate('participants.user', 'username')
      .lean()
      .then(populated => ({
        ...populated,
        participants: populated.participants.map(p => ({
          user: p.user,
          status: p.status,
          cancelCount: p.cancelCount,
        }))
      }));
  }

  // Mark attendance
  async markAttendance(eventId, creatorId, userId, attended) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');
    if (event.creator.toString() !== creatorId) throw new Error('只有活动创建者可以操作出勤');

    const participant = event.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error('未找到该报名用户');
    if (participant.status !== 'approved') throw new Error('只能操作已通过的用户');

    participant.status = attended ? 'checkedIn' : 'noShow';
    await event.save();

    // Send notification when user is checked in
    if (attended) {
      const [creator, recipient] = await Promise.all([
        User.findById(creatorId).select('username'),
        User.findById(userId, 'username')
      ]);
      
      // Get user's participation count after this check-in
      // Count all events where user has checkedIn status (will include this one after save)
      const participatedEvents = await Event.find({
        'participants.user': userId,
        'participants.status': 'checkedIn'
      });
      const participationCount = participatedEvents.length;
      
      if (creator && recipient) {
        await Notification.create({
          recipient: userId,
          sender: creatorId,
          type: 'event_checkin',
          title: '活动签到确认',
          message: `${recipient.username}，恭喜！你参加了「${event.title}」，参加活动总数 +1，累计：${participationCount} 场`,
          eventId: event._id,
          metadata: {
            eventTitle: event.title,
            eventTime: event.startTime,
            eventLocation: event.location,
            userName: recipient.username,
            organizerName: creator.username,
            participationCount: participationCount
          }
        });
      }
    }

    return Event.findById(event.id)
      .populate('participants.user', 'username')
      .lean()
      .then(populated => ({
        ...populated,
        participants: populated.participants.map(p => ({
          user: p.user,
          status: p.status,
          cancelCount: p.cancelCount,
        }))
      }));
  }

  // Request cancellation
  async requestCancellation(eventId, userId) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');

    const participant = event.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error('你未报名该活动');
    if (participant.status !== 'approved') throw new Error('只有已通过的用户才能申请取消');

    participant.status = 'requestingCancellation';
    await event.save();
    return event;
  }

  // Review cancellation request
  async reviewCancellation(eventId, creatorId, userId, approve) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('活动未找到');
    if (event.creator.toString() !== creatorId) throw new Error('只有活动创建者可以审核取消申请');

    const participant = event.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error('未找到该用户');
    if (participant.status !== 'requestingCancellation') throw new Error('该用户未申请取消');

    participant.status = approve ? 'cancelled' : 'approved';
    await event.save();
    return event;
  }
}

module.exports = new EventService();