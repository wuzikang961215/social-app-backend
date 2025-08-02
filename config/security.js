module.exports = {
  // Password requirements
  password: {
    minLength: 6,
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false
  },

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },

  // Bcrypt settings
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // Rate limiting
  rateLimit: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 auth requests per windowMs
      skipSuccessfulRequests: true
    },
    createContent: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10 // limit each IP to 10 content creation requests per hour
    }
  },

  // Account lockout
  accountLockout: {
    maxAttempts: 5,
    lockoutDuration: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    resetAttemptsAfter: 60 * 60 * 1000 // Reset attempts after 1 hour
  },

  // Session settings
  session: {
    name: 'sessionId',
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // CORS settings
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // MongoDB connection
  mongodb: {
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  }
};