const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 User registration
router.post("/register", async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      interests,
      personality,
      tags,
      canJoinPaid,
      canJoinPaidMonthly,
      canJoinFree,
      canJoinFreeMonthly,
      expectPaid,
      expectFree,
      whyJoin,
      idealBuddy,
      willPromote,
    } = req.body;

    // ✅ 查重
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "用户名或邮箱已被使用" });
    }

    // ✅ 创建新用户，写入所有字段
    const newUser = new User({
      username,
      email,
      password,
      interests,
      personality,
      tags,
      canJoinPaid,
      canJoinPaidMonthly,
      canJoinFree,
      canJoinFreeMonthly,
      expectPaid,
      expectFree,
      whyJoin,
      idealBuddy,
      willPromote,
    });

    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

  

// 📌 User login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("用户不存在");
      err.statusCode = 404;
      throw err;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("密码错误");
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

// 📌 Get current user information
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // 不返回密码
    if (!user) return res.status(404).json({ message: "用户不存在" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "服务器错误" });
  }
});

// 📌 Get user info by ID（用于获取活动发起人信息）
router.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "用户不存在" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "服务器错误" });
  }
});


// ✏️ 管理员修改任意用户信息（或者你自己手动修改自己也行）
router.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // 你自己在前端确保不要乱传，比如 password 等字段
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "用户未找到" });
    }

    res.json({ message: "用户信息更新成功", user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// ✅ 查用户名是否存在
router.get("/check-username", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: "用户名不能为空" });

  const exists = await User.exists({ username });
  res.json({ exists: !!exists });
});

// ✅ 查邮箱是否存在
router.get("/check-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "邮箱不能为空" });

  const exists = await User.exists({ email });
  res.json({ exists: !!exists });
});



module.exports = router;
