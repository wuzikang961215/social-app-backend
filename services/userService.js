const bcrypt = require("bcryptjs");
const User = require("../models/User");

class UserService {
  async getMe(userId) {
    return User.findById(userId).select("-password");
  }

  async getUserById(userId) {
    return User.findById(userId).select("-password");
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

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async checkUsername(username) {
    return !!(await User.exists({ username }));
  }

  async checkEmail(email) {
    return !!(await User.exists({ email }));
  }

  async getUserCount() {
    return User.countDocuments();
  }
}

module.exports = new UserService();
