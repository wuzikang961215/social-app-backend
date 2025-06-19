const statsService = require("../services/statsService");

class StatsController {
  async getTopInterests(req, res) {
    try {
      const result = await statsService.getTopInterests();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  }
}

module.exports = new StatsController();
