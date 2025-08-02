const bcrypt = require("bcryptjs");
const User = require("../models/User");

class UserService {
  async getMe(userId) {
    return User.findById(userId).select("-password");
  }

  async getUserById(userId) {
    return User.findById(userId).select("-password");
  }

  async updateUser(userId, updateData, requesterId, requesterRole) {
    // Allow users to update their own profile or admins to update any profile
    if (requesterId !== userId && requesterRole !== "admin") {
      throw new Error("无权限操作（只能修改自己的资料）");
    }
    
    // Restrict certain fields that only admins can update
    if (requesterRole !== "admin") {
      // Regular users cannot change their role or other sensitive fields
      delete updateData.role;
      delete updateData.email; // Prevent email changes without verification
      delete updateData.password; // Password changes should go through a separate flow
    }
    
    if (updateData.password && requesterRole === "admin") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
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
