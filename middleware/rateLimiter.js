// middleware/rateLimiter.js
const rateLimit = {};

const rateLimiter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "未授权，请先登录" });
  }

  const userId = req.user.id;
  if (rateLimit[userId] && Date.now() - rateLimit[userId] < 1000) {
    return res.status(429).json({ message: "操作太快了，请稍后再试" });
  }

  rateLimit[userId] = Date.now();
  next();
};

// 定期清理
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimit).forEach((userId) => {
    if (now - rateLimit[userId] > 10000) {
      delete rateLimit[userId];
    }
  });
}, 10000);

module.exports = rateLimiter;
