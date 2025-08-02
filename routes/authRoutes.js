const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { 
  validateRegister, 
  validateLogin, 
  validateRequestReset, 
  validateResetPassword 
} = require("../middleware/validation");

// 📌 用户注册与登录
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);

// 密码重置
router.post("/request-reset", validateRequestReset, authController.requestPasswordReset);
router.post("/reset-password", validateResetPassword, authController.resetPassword);

module.exports = router;
