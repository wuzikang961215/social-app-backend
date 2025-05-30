// scripts/updateScore.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/../.env" }); // 👈 显式指定路径

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  score: Number, // ✅ 确保有 score 字段
}, { strict: false }); // 保证不会因缺字段报错

const User = mongoose.model("User", UserSchema);

const updateAllScores = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ 已连接数据库");

    const result = await User.updateMany({}, { $set: { score: 30 } });
    console.log(`🎯 成功更新 ${result.modifiedCount} 个用户`);

    const count = await User.countDocuments({ score: 30 });
    console.log(`🔍 当前共有 ${count} 个用户 score 为 30`);

    await mongoose.disconnect();
    console.log("✅ 已断开连接");
    process.exit(0);
  } catch (err) {
    console.error("❌ 执行出错:", err);
    process.exit(1);
  }
};

updateAllScores();
