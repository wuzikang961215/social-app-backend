const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// 📌 User registration
router.post("/register", authController.register);

// 📌 User login
router.post("/login", authController.login);

// 📌 Get current user information
router.get("/me", authMiddleware, authController.getMe);

// 📌 Get user info by ID（用于获取活动发起人信息）
router.get("/users/:id", authMiddleware, authController.getUserById);

// ✏️ 管理员修改任意用户信息（或者你自己手动修改自己也行）
router.patch("/:id", authMiddleware, authController.updateUser);

// ✅ 查用户名是否存在
router.get("/check-username", authController.checkUsername);

// ✅ 查邮箱是否存在
router.get("/check-email", authController.checkEmail);

module.exports = router;
