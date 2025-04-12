const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const EventSchema = new mongoose.Schema({
  title: String,
  date: Date, // ✅ 临时加入用于读取
  startTime: Date,
  durationMinutes: Number,
});

const Event = mongoose.model("Event", EventSchema);

const migrateDateToStartTime = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ 已连接数据库");

    const events = await Event.find({ date: { $exists: true } });
    console.log(`🔍 找到 ${events.length} 个含有 date 字段的文档`);

    let successCount = 0;

    for (const doc of events) {
      const rawDate = doc.toObject().date;

      if (!rawDate) {
        console.warn("⚠️ 跳过一个没有有效 date 的文档:", doc._id.toString());
        continue;
      }

      doc.set("startTime", rawDate);
      doc.set("durationMinutes", 90);

      doc.set("date", undefined, { strict: false }); // ✅ 删除旧字段

      await doc.save();
      console.log(`✅ 更新文档 ${doc._id.toString()} 成功`);
      successCount++;
    }

    console.log(`🎉 共成功更新 ${successCount} 个文档`);

    const remaining = await Event.find({ date: { $exists: true } });
    if (remaining.length > 0) {
      console.warn(`⚠️ 仍有 ${remaining.length} 个文档含有 date 字段`);
    } else {
      console.log("✅ 所有文档已清除 date 字段");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ 脚本出错：", err);
    process.exit(1);
  }
};

migrateDateToStartTime();
