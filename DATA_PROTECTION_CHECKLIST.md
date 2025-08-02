# Data Protection & Backup Verification Checklist

## 🚨 CRITICAL: Verify Your MongoDB Atlas Backup Status NOW

### Step 1: Check Current Backup Status

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com
2. Navigate to your cluster
3. Click "Backup" in the left sidebar
4. **CHECK**: Is "Cloud Backup" enabled? 
   - ✅ If YES: Note your backup schedule
   - ❌ If NO: **ENABLE IT IMMEDIATELY**

### Step 2: MongoDB Atlas Backup Settings

If backups are NOT enabled, follow these steps:

1. Click "Enable Cloud Backup"
2. Select backup schedule:
   - **Recommended**: Continuous backups with point-in-time recovery
   - **Minimum**: Daily snapshots

3. Configure retention:
   - Daily snapshots: 7 days (minimum)
   - Weekly snapshots: 4 weeks
   - Monthly snapshots: 6-12 months

### Step 3: Data Loss Prevention Strategies

#### A. Application-Level Protection

```javascript
// Add to your eventService.js for critical operations
async criticalUpdate(data) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Your update logic here
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

#### B. Database-Level Protection

1. **Enable MongoDB Transactions** (already using in some places)
2. **Set Write Concern to "majority"**:
   ```javascript
   mongoose.connect(uri, {
     writeConcern: {
       w: 'majority',
       j: true,
       wtimeout: 1000
     }
   });
   ```

3. **Enable Retryable Writes**:
   ```javascript
   mongoose.connect(uri, {
     retryWrites: true
   });
   ```

### Step 4: Monitoring & Alerts

Set up these alerts in MongoDB Atlas:

1. **Backup Alerts**:
   - Backup failure
   - Backup delay > 1 hour
   - Storage quota > 80%

2. **Cluster Alerts**:
   - Primary election
   - Replication lag > 60 seconds
   - Disk usage > 80%

3. **Performance Alerts**:
   - Query targeting ratio < 1000
   - Page faults > 100/sec

### Step 5: Regular Backup Testing

#### Monthly Backup Test Procedure:

1. **Create Test Database**:
   ```bash
   # In MongoDB Atlas, create a new cluster for testing
   # Name it: social-app-test-restore
   ```

2. **Restore Latest Backup**:
   - Select your latest backup
   - Restore to test cluster
   - Verify data integrity

3. **Data Integrity Checks**:
   ```javascript
   // Run these checks after restore
   const userCount = await User.countDocuments();
   const eventCount = await Event.countDocuments();
   const notificationCount = await Notification.countDocuments();
   
   console.log(`Users: ${userCount}`);
   console.log(`Events: ${eventCount}`);
   console.log(`Notifications: ${notificationCount}`);
   ```

### Step 6: Disaster Recovery Plan

#### If Data Loss Occurs:

1. **STOP all write operations immediately**
2. **Contact MongoDB Atlas Support** (if on paid plan)
3. **Identify the point of data loss**
4. **Use point-in-time recovery** to restore

#### Recovery Contacts:
- Primary DBA: [Your name/contact]
- MongoDB Atlas Support: support@mongodb.com
- Backup Admin: [Backup person contact]

### Step 7: Additional Protection Measures

1. **Daily Health Check Script**:
```javascript
// Add to scripts/healthCheck.js
const checkDatabaseHealth = async () => {
  try {
    // Check connection
    await mongoose.connection.db.admin().ping();
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Check replica set status
    const status = await mongoose.connection.db.admin().replSetGetStatus();
    
    console.log('Database Health: OK');
    console.log(`Collections: ${collections.length}`);
    console.log(`Replica Set: ${status.ok ? 'Healthy' : 'Issues Detected'}`);
  } catch (error) {
    console.error('Database Health Check Failed:', error);
    // Send alert!
  }
};
```

2. **Implement Soft Deletes**:
```javascript
// Instead of hard deleting, add deletedAt field
eventSchema.add({
  deletedAt: { type: Date, default: null }
});

// Override delete to soft delete
eventSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};
```

3. **Activity Logging**:
```javascript
// Log all critical operations
const logActivity = async (action, userId, data) => {
  await ActivityLog.create({
    action,
    userId,
    data,
    timestamp: new Date()
  });
};
```

## ⚡ IMMEDIATE ACTIONS REQUIRED

1. [ ] **RIGHT NOW**: Login to MongoDB Atlas and verify backup is enabled
2. [ ] **TODAY**: Set up backup alerts
3. [ ] **THIS WEEK**: Test a restore operation
4. [ ] **THIS WEEK**: Implement transaction wrapper for critical operations
5. [ ] **THIS MONTH**: Run a full disaster recovery drill

## 🔴 WARNING SIGNS OF DATA ISSUES

Watch for these indicators:
- Sudden drop in document counts
- Users reporting missing data
- Unusual spike in error logs
- Backup failures
- Replication lag alerts

## 📞 Emergency Contacts

- MongoDB Atlas Support: https://support.mongodb.com
- Your MongoDB Atlas Org ID: [Find in Atlas settings]
- Cluster Name: [Your cluster name]

Remember: **No backup = No business**. Protect your users' data!