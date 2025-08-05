// utils/scheduler.js
const cron = require("node-cron");
const Event = require("../models/Event");
const ExternalEvent = require("../models/ExternalEvent");
const { formatToSydneyString, hasEventExpired } = require("./dateUtils");

// Run check immediately on startup
const checkExpiredEvents = async () => {
  try {
    const now = new Date();
    console.log(`🕒 正在检查过期活动... 当前时间: ${now.toISOString()}`);
    
    // Find all non-expired events
    const activeEvents = await Event.find({ expired: false });
    console.log(`📋 找到 ${activeEvents.length} 个未过期的活动`);
    
    let expiredCount = 0;
    
    // Check each event to see if it has actually ended
    for (const event of activeEvents) {
      const isExpired = hasEventExpired(event.startTime, event.durationMinutes);
      console.log(`  - 活动「${event.title}」: 开始时间 ${event.startTime}, 时长 ${event.durationMinutes}分钟, 是否过期: ${isExpired}`);
      
      if (isExpired) {
        event.expired = true;
        await event.save();
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`✅ 已自动设置 ${expiredCount} 个活动为 expired`);
    } else {
      console.log(`✅ 没有需要更新的活动`);
    }
  } catch (err) {
    console.error("❌ 定时任务错误：", err);
  }
};

// Clean up old external events (7 days after they've passed)
const cleanupOldExternalEvents = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await ExternalEvent.deleteMany({
      time: { $lt: sevenDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 已清理 ${result.deletedCount} 个过期的外部活动`);
    }
  } catch (err) {
    console.error("❌ 清理外部活动错误：", err);
  }
};

// Run immediately on startup
checkExpiredEvents();
cleanupOldExternalEvents();

// Then run every hour
cron.schedule("0 * * * *", checkExpiredEvents);

// Run cleanup once a day at 3 AM
cron.schedule("0 3 * * *", cleanupOldExternalEvents);

console.log("📅 活动过期检查调度器已启动 (每小时运行一次)");
console.log("🧹 外部活动清理调度器已启动 (每天凌晨3点运行)");
