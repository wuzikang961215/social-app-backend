const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// ✅ 获取热门兴趣
router.get("/top-interests", statsController.getTopInterests);

module.exports = router;
