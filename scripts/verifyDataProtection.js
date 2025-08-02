const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDataProtection() {
  console.log('🔍 Data Protection Verification Script\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check connection settings
    console.log('1️⃣ Connection Settings:');
    const conn = mongoose.connection;
    console.log(`   - Host: ${conn.host}`);
    console.log(`   - Database: ${conn.name}`);
    console.log(`   - Replica Set: ${conn.options.replicaSet || 'Not configured'}`);
    console.log(`   - Retry Writes: ${conn.options.retryWrites !== false ? '✅ Enabled' : '❌ Disabled'}`);
    console.log('');

    // 2. Check if using MongoDB Atlas
    console.log('2️⃣ MongoDB Atlas Check:');
    const isAtlas = conn.host && conn.host.includes('mongodb.net');
    if (isAtlas) {
      console.log('   ✅ Using MongoDB Atlas (backups available)');
      console.log('   ⚠️  ACTION: Login to Atlas and verify backups are enabled');
    } else {
      console.log('   ❌ Not using MongoDB Atlas - Manual backups required!');
    }
    console.log('');

    // 3. Check replica set status
    console.log('3️⃣ Replica Set Status:');
    try {
      const admin = conn.db.admin();
      const status = await admin.replSetGetStatus();
      console.log(`   ✅ Replica set is healthy`);
      console.log(`   - Members: ${status.members.length}`);
      console.log(`   - Primary: ${status.members.find(m => m.stateStr === 'PRIMARY').name}`);
    } catch (error) {
      console.log('   ⚠️  Not using replica set (single node - risky!)');
    }
    console.log('');

    // 4. Check collections and document counts
    console.log('4️⃣ Data Statistics:');
    const collections = await conn.db.listCollections().toArray();
    
    for (const coll of collections) {
      const count = await conn.db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name}: ${count} documents`);
    }
    console.log('');

    // 5. Check indexes
    console.log('5️⃣ Critical Indexes:');
    const userIndexes = await conn.db.collection('users').indexes();
    const eventIndexes = await conn.db.collection('events').indexes();
    console.log(`   - User indexes: ${userIndexes.length}`);
    console.log(`   - Event indexes: ${eventIndexes.length}`);
    console.log('');

    // 6. Recommendations
    console.log('📋 RECOMMENDATIONS:\n');
    
    console.log('🔴 CRITICAL (Do immediately):');
    if (isAtlas) {
      console.log('   1. Login to MongoDB Atlas and verify Cloud Backup is ENABLED');
      console.log('   2. Set up backup failure alerts');
      console.log('   3. Test restore process this week');
    } else {
      console.log('   1. Migrate to MongoDB Atlas for automatic backups');
      console.log('   2. Set up manual backup script with mongodump');
      console.log('   3. Store backups in multiple locations');
    }
    console.log('');

    console.log('🟡 IMPORTANT (Do this week):');
    console.log('   1. Implement transaction wrappers for critical updates');
    console.log('   2. Add soft delete functionality');
    console.log('   3. Set up database monitoring');
    console.log('');

    console.log('🟢 GOOD PRACTICES (Do this month):');
    console.log('   1. Regular backup restore tests');
    console.log('   2. Document recovery procedures');
    console.log('   3. Train team on disaster recovery');
    console.log('');

    // 7. Connection string recommendations
    console.log('💡 Recommended Connection String Options:');
    console.log('```');
    console.log('mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority&wtimeoutMS=5000');
    console.log('```');
    console.log('');

    console.log('✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Add backup test function
async function testBackupRestore() {
  console.log('\n🧪 Backup Test Procedure:\n');
  console.log('1. Create a test event with unique title');
  console.log('2. Note the event ID');
  console.log('3. In MongoDB Atlas, create a backup');
  console.log('4. Delete the test event');
  console.log('5. Restore from backup');
  console.log('6. Verify test event is restored');
  console.log('\nThis ensures your backup/restore process works!');
}

// Run verification
verifyDataProtection().then(() => {
  testBackupRestore();
});