const statsService = require("../services/statsService");
const Event = require('../models/Event');
const { hasEventExpired } = require('../utils/dateUtils');

class StatsController {
  async getTopInterests(req, res) {
    try {
      const result = await statsService.getTopInterests();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }

  async getUserStats(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Get events created by user
      const createdEvents = await Event.find({ creator: userId });
      
      // Get events where user participated
      const participatedEvents = await Event.find({
        'participants.user': userId
      });

      // Calculate statistics
      let checkedInCount = 0;
      let noShowCount = 0;

      participatedEvents.forEach(event => {
        const participant = event.participants.find(p => 
          p.user.toString() === userId
        );
        
        // Check if event has actually expired based on time, not just the expired flag
        const isExpired = hasEventExpired(event.startTime, event.durationMinutes);
        
        if (participant && isExpired) {
          if (participant.status === 'checkedIn') {
            checkedInCount++;
          } else if (participant.status === 'noShow') {
            noShowCount++;
          }
        }
      });

      const totalAttended = checkedInCount + noShowCount;
      const attendanceRate = totalAttended > 0 
        ? Math.round((checkedInCount / totalAttended) * 100) 
        : 0;

      res.json({
        createdCount: createdEvents.length,
        participatedCount: totalAttended,
        checkedInCount,
        noShowCount,
        attendanceRate
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatsController();
