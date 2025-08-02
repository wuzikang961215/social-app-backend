# Security Recommendations for Production

## CRITICAL - Must Fix Before Production

### 1. Database Security
- [ ] **Remove .env from git history** 
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env" \
    --prune-empty --tag-name-filter cat -- --all
  ```
- [ ] **Change MongoDB password immediately** (it's exposed in your current .env)
- [ ] **Use environment variables from hosting provider** (Fly.io secrets)
- [ ] **Enable MongoDB IP whitelist** to only allow your server IPs

### 2. Input Validation & Sanitization
- [ ] Install and use validation libraries:
  ```bash
  npm install express-validator express-mongo-sanitize helmet
  ```
- [ ] Add to server.js:
  ```javascript
  const mongoSanitize = require('express-mongo-sanitize');
  const helmet = require('helmet');
  
  app.use(helmet());
  app.use(mongoSanitize());
  ```

### 3. Authentication & Authorization
- [ ] Add refresh token mechanism
- [ ] Implement proper password reset token expiry (currently missing)
- [ ] Add account lockout after failed attempts
- [ ] Use bcrypt rounds of at least 12

### 4. API Security
- [ ] Configure CORS properly:
  ```javascript
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }));
  ```
- [ ] Use proper rate limiting:
  ```bash
  npm install express-rate-limit
  ```
- [ ] Add request size limits:
  ```javascript
  app.use(express.json({ limit: '10mb' }));
  ```

### 5. Data Protection
- [ ] Set up automated database backups
- [ ] Implement soft deletes for critical data
- [ ] Add audit logs for sensitive operations
- [ ] Encrypt sensitive user data

## Recommended Security Additions

### 1. Environment Variables (.env.example)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME=socialApp

# Authentication
JWT_SECRET=use-a-long-random-string-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=another-long-random-string
REFRESH_TOKEN_EXPIRES_IN=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=2h

# URLs
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Backup Strategy
- Use MongoDB Atlas automated backups
- Set up daily snapshots
- Test restore procedures monthly
- Keep backups for at least 30 days

### 3. Monitoring & Alerts
- Set up error tracking (Sentry)
- Monitor failed login attempts
- Alert on unusual database queries
- Track API response times

### 4. Security Headers
Add these headers for additional protection:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 5. Data Validation Example
```javascript
const { body, validationResult } = require('express-validator');

// Event creation validation
const validateEvent = [
  body('title').isString().trim().isLength({ min: 1, max: 100 }),
  body('location').isString().trim().isLength({ min: 1, max: 200 }),
  body('maxParticipants').isInt({ min: 1, max: 1000 }),
  body('description').optional().isString().trim().isLength({ max: 1000 }),
  body('startTime').matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

## Immediate Actions Required

1. **Change your MongoDB password NOW** - it's exposed in your .env
2. **Remove .env from git** and add to .gitignore
3. **Set up environment variables in Fly.io**
4. **Enable MongoDB Atlas IP whitelist**
5. **Install security packages** (helmet, express-validator, etc.)

## Testing Security

After implementing these changes:
1. Run security audit: `npm audit`
2. Test with OWASP ZAP or similar tools
3. Attempt SQL/NoSQL injection tests
4. Verify rate limiting works
5. Test authentication edge cases