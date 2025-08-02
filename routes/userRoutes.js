const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateUpdateProfile } = require("../middleware/validation");

// ✅ 用户名/邮箱查重 —— 👈 放到最前面
router.get("/check-username", userController.checkUsername);
router.get("/check-email", userController.checkEmail);

// ✅ 获取总用户数量
router.get("/count", userController.getUserCount);

// ✅ 获取当前用户信息
router.get("/me", authMiddleware, userController.getMe);

// ✅ 获取指定用户（路径 /:id 要放最后）
router.get("/:id", authMiddleware, userController.getUserById);

// ✅ 更新用户信息（限管理员）
router.patch("/:id", authMiddleware, validateUpdateProfile, userController.updateUser);

// ✅ 删除用户（限管理员）
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
