// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: '数据验证失败',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} 已存在`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: '无效的认证令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: '认证令牌已过期'
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      message: '无效的ID格式'
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message
    });
  }

  // Default server error
  res.status(500).json({
    message: '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

// Not found handler
const notFound = (req, res, next) => {
  res.status(404).json({
    message: `路由 ${req.originalUrl} 不存在`
  });
};

module.exports = {
  errorHandler,
  notFound
};