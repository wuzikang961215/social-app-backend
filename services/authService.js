const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthService {
  async register(userData) {
    const { username, email, password, ...rest } = userData;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) throw new Error("用户名或邮箱已被使用");

    const newUser = new User({ username, email, password, ...rest });
    await newUser.save();
    return newUser;
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("用户不存在");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("密码错误");

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return { token, user };
  }

  async getMe(userId) {
    return User.findById(userId).select("-password");
  }

  async getUserById(userId) {
    return User.findById(userId).select("-password");
  }

  async getUserCount() {
    return User.countDocuments();
  }

  async updateUser(userId, updateData, requesterRole) {
    if (requesterRole !== "admin") throw new Error("无权限操作（仅限超级管理员）");
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) throw new Error("用户未找到");
    return updatedUser;
  }

  async checkUsername(username) {
    return !!(await User.exists({ username }));
  }

  async checkEmail(email) {
    return !!(await User.exists({ email }));
  }
}

module.exports = new AuthService();
