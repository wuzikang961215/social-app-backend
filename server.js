const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { rateLimit } = require("express-rate-limit");

dotenv.config(); // 读取 .env 文件

const app = express();

// Trust proxy configuration
// Use a specific number instead of true to avoid rate limit bypass
app.set('trust proxy', 1); // Trust first proxy only

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Configure CORS properly
const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL,
          'https://www.yodda.social',
          'https://yodda.social',  // Also allow without www
          'capacitor://localhost', // Capacitor iOS
          'http://localhost', // Capacitor Android
          /^https:\/\/.*\.vercel\.app$/,  // Allow Vercel deployments
          /^https:\/\/.*\.vercel\.sh$/    // Allow Vercel preview URLs
        ].filter(Boolean)
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      // For debugging, temporarily allow all origins but log them
      console.log(`Temporarily allowing origin: ${origin}`);
      callback(null, true);
    }
  }
};

app.use(cors(corsOptions));

// Global rate limiting - more lenient for mobile app usage
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Increased from 300 to 500
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  // More intelligent key generation for mobile networks
  keyGenerator: (req) => {
    const ip = req.ip;
    // If authenticated, use user ID + IP for more granular limiting
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Simple hash of token to identify user without decoding
      const tokenHash = require('crypto').createHash('md5').update(token).digest('hex').substring(0, 8);
      return `${ip}_user_${tokenHash}`;
    }
    // For unauthenticated requests, consider device type
    const ua = req.headers['user-agent'] || 'unknown';
    const deviceInfo = ua.includes('iPhone') ? 'ios' : 
                      ua.includes('Android') ? 'android' : 'web';
    return `${ip}_${deviceInfo}`;
  },
  skip: (req) => {
    // Skip rate limiting for certain paths in development
    if (process.env.NODE_ENV !== 'production') {
      const exemptPaths = ['/api/notifications/unread-count', '/api/events/manage', '/api/users/'];
      return exemptPaths.some(path => req.path.startsWith(path));
    }
    // In production, be more lenient with authenticated users
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Give authenticated users a higher limit by skipping 50% of the time
      return Math.random() < 0.5;
    }
    return false;
  }
});

// ✅ 路由
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/statsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const treeHoleRoutes = require("./routes/treeHoleRoutes");
const externalEventRoutes = require("./routes/externalEventRoutes");

// Health check endpoint (before rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'no-origin',
    userAgent: req.headers['user-agent'] || 'no-user-agent',
    ip: req.ip,
    method: req.method,
    path: req.path
  });
});

// Apply global rate limiting - DISABLED for now due to mobile network issues
// Uncomment below to re-enable if needed
// app.use('/api/', globalLimiter);

// Log all requests in production for debugging
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip} - UA: ${req.headers['user-agent']?.substring(0, 50)}`);
    next();
  });
}

// Debug middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Auth-specific rate limiting - very lenient to avoid blocking legitimate users
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // 10 attempts per minute per device
  message: '请求过于频繁，请1分钟后再试',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  // Consider email + device to avoid blocking shared networks
  keyGenerator: (req) => {
    const ip = req.ip;
    const email = req.body?.email || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    const deviceInfo = ua.includes('iPhone') ? 'ios' : 
                      ua.includes('Android') ? 'android' : 'web';
    // Use email + device type to be very specific
    return `${email}_${deviceInfo}_${ip}`;
  }
});

app.use("/api/events", eventRoutes);
app.use("/api/auth", authLimiter, authRoutes);    // 登录注册 with stricter rate limiting
app.use("/api/users", userRoutes);   // 用户信息
app.use("/api/stats", statsRoutes);  // 统计/兴趣/邮箱名查重
app.use("/api/notifications", notificationRoutes);  // 通知
app.use("/api/tree-hole", treeHoleRoutes);  // 树洞匿名发帖
app.use("/api/external-events", externalEventRoutes);  // 外部活动管理

app.use(morgan("dev"));

// Import error handlers
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("✅ MongoDB Connected");

    // ⏰ 引入并启动定时任务
    require("./utils/scheduler"); // 路径按实际调整
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors 
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format' 
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ 
      message: `${field} already exists` 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expired' 
    });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error' 
  });
});

const PORT = process.env.PORT || 3002;

// Only start the server in non-test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app; // ✅ Important: Export `app` for Jest to use directly
