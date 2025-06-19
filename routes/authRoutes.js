const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// 📌 用户注册与登录
router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
