const authService = require("../services/authService");

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { token, user } = await authService.login(email, password);
      res.json({ token, user });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id);
      if (!user) return res.status(404).json({ message: "用户不存在" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await authService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: "用户不存在" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }

  async updateUser(req, res, next) {
    try {
      const updatedUser = await authService.updateUser(req.params.id, req.body, req.user.role);
      res.json({ message: "用户信息更新成功", user: updatedUser });
    } catch (error) {
      res.status(403).json({ message: error.message });
    }
  }

  async checkUsername(req, res) {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "用户名不能为空" });
    const exists = await authService.checkUsername(username);
    res.json({ exists });
  }

  async checkEmail(req, res) {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "邮箱不能为空" });
    const exists = await authService.checkEmail(email);
    res.json({ exists });
  }
}

module.exports = new AuthController();