// utils/scheduler.js
const cron = require("node-cron");
const Event = require("../models/Event");

// 每小时运行一次
cron.schedule("0 * * * *", async () => {
  try {
    const now = new Date();

    const result = await Event.updateMany(
      { date: { $lt: now }, expired: false },
      { $set: { expired: true } }
    );

    if (result.modifiedCount > 0) {
      console.log(`🕒 已自动设置 ${result.modifiedCount} 个活动为 expired`);
    }
  } catch (err) {
    console.error("❌ 定时任务错误：", err);
  }
});
