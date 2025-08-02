const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// ✅ 获取热门兴趣
router.get("/top-interests", statsController.getTopInterests);

// 获取用户统计数据
router.get("/user/:userId", statsController.getUserStats);

module.exports = router;
