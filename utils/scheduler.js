// utils/scheduler.js
const cron = require("node-cron");
const Event = require("../models/Event");
const { formatToSydneyString, hasEventExpired } = require("./dateUtils");

// 每小时运行一次
cron.schedule("0 * * * *", async () => {
  try {
    // Find all non-expired events
    const activeEvents = await Event.find({ expired: false });
    let expiredCount = 0;
    
    // Check each event to see if it has actually ended
    for (const event of activeEvents) {
      if (hasEventExpired(event.startTime, event.durationMinutes)) {
        event.expired = true;
        await event.save();
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🕒 已自动设置 ${expiredCount} 个活动为 expired`);
    }
  } catch (err) {
    console.error("❌ 定时任务错误：", err);
  }
});
