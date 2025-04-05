const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Event = require("../models/Event");

const cleanWaitlistField = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ 已连接数据库");

    const docs = await Event.find({ subCategory: { $exists: true } });
    console.log(`🔍 找到 ${docs.length} 个含有 subCategory 的文档`);

    let modified = 0;

    for (const doc of docs) {
      console.log("🧾 原始文档 ID:", doc._id.toString());
      console.log("🧾 当前 subCategory 字段内容:", doc.subCategory);

      // 检查是否真的是空数组（如果是空数组，Mongoose 不一定允许删）
      if (doc.subCategory && doc.subCategory.length === 0) {
        console.log("👉 是空数组，尝试删除...");
      } else if (doc.subCategory && doc.subCategory.length > 0) {
        console.log("⚠️ 是非空数组，也将尝试删除...");
      }

      // 强制删除 subCategory 字段
      doc.set("subCategory", undefined, { strict: false });
      await doc.save();
      console.log("✅ 删除并保存成功！");
      modified++;
    }

    console.log(`🧹 已从 ${modified} 个文档中彻底删除 subCategory 字段`);

    const remaining = await Event.find({ subCategory: { $exists: true } });
    if (remaining.length === 0) {
      console.log("✅ 清除完成，所有 subCategory 字段都不见了");
    } else {
      console.warn(`⚠️ 仍然有 ${remaining.length} 个含 subCategory 的文档`);
      remaining.forEach((doc) => {
        console.log("🚨 残留文档 ID:", doc._id.toString());
        console.log("🚨 残留 subCategory:", doc.subCategory);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ 出错：", err);
    process.exit(1);
  }
};

cleanWaitlistField();
