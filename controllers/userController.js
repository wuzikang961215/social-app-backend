const userService = require("../services/userService");

class UserController {
  async getMe(req, res) {
    try {
      const user = await userService.getMe(req.user.id);
      if (!user) return res.status(404).json({ message: "用户不存在" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: "用户不存在" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }

  async updateUser(req, res) {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body, req.user.role);
      res.json({ message: "用户信息更新成功", user: updatedUser });
    } catch (error) {
      res.status(403).json({ message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "无权限操作（仅限管理员）" });
      }

      const result = await userService.deleteUser(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "用户不存在" });
      }

      res.json({ message: "用户已成功删除" });
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }

  async checkUsername(req, res) {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "用户名不能为空" });
    const exists = await userService.checkUsername(username);
    res.json({ exists });
  }

  async checkEmail(req, res) {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "邮箱不能为空" });
    const exists = await userService.checkEmail(email);
    res.json({ exists });
  }

  async getUserCount(req, res) {
    try {
      const count = await userService.getUserCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "获取用户数量失败" });
    }
  }
}

module.exports = new UserController();
