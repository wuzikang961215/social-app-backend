const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config(); // 读取 .env 文件

const app = express();
app.use(express.json());
app.use(cors());

const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.use(morgan("dev"));

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("✅ MongoDB Connected");

    // ⏰ 引入并启动定时任务
    require("./utils/scheduler"); // 路径按实际调整
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3002;

// Only start the server in non-test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app; // ✅ Important: Export `app` for Jest to use directly
