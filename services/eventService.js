const Event = require('../models/Event');
const User = require('../models/User');


class EventService {
  // Find events with optional category filter
  async findEvents(category = null) {
    const filter = category ? { category } : {};
    return Event.find(filter)
      .populate('participants.user', 'username email')
      .populate('creator', 'username email');
  }

  // Find manageable events for a user
  async findManageableEvents(userId) {
    const events = await Event.find({ creator: userId })
      .populate('participants.user', 'username isVIP score idealBuddy whyJoin interests')
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
      .populate('participants.user', 'username isVIP score idealBuddy whyJoin interests')
      .populate('creator', 'username email');
  }

  // Find participated events
  async findParticipatedEvents(userId) {
    const events = await Event.find({
      'participants.user': userId
    })
      .populate('participants.user', 'username isVIP score idealBuddy whyJoin interests')
      .populate('creator', 'username email');

    return events
      .map(event => {
        const isParticipating = event.participants.find(
          p => p.user.id === userId && !['denied', 'cancelled'].includes(p.status)
        );
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
    const user = await User.findById(eventData.creator);
    if (!user || (user.score ?? 0) < 30) {
      throw new Error("积分不足，无法创建活动");
    }
  
    const newEvent = new Event(eventData);
    return await newEvent.save(); // ✅ 这里不扣分
  }  

  // Update event
  async updateEvent(eventId, updateData) {
    return Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    );
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
      if (existing.status === 'cancelled') {
        if (existing.cancelCount >= 2) {
          throw new Error('你已取消报名超过2次，不能再次加入');
        }
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
    if (participant.status !== 'pending') throw new Error('你已被审核，无法取消报名');

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

    return Event.findById(event.id)
      .populate('participants.user', 'username level score isVIP')
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

    // ✅ 实时加分逻辑
    const user = await User.findById(userId);
    if (user) {
      if (attended) {
        user.score = (user.score || 0) + 5;
      } else {
        user.score = (user.score || 0) - 10;
      }
      await user.save();
    }
    
    await event.save();

    // ✅ 如果是签到，则更新主办人积分
    if (attended) {
      const checkedInCount = event.participants.filter(p => p.status === "checkedIn").length;

      const host = await User.findById(creatorId);
      if (host) {
        if (checkedInCount === 1) {
          // 第一个签到，加 5（基础）+ 1（每人）
          host.score = (host.score || 0) + 6;
        } else {
          // 后续每个签到加 1 分
          host.score = (host.score || 0) + 1;
        }
        await host.save();
      }
    }

    return Event.findById(event.id)
      .populate('participants.user', 'username level score isVIP')
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