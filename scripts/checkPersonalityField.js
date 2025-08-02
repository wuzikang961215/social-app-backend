require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkPersonalityField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users who have a personality field
    const usersWithPersonality = await User.find({ 
      personality: { $exists: true, $ne: null, $ne: '' } 
    }).select('username email personality mbti');

    console.log(`\n📊 Found ${usersWithPersonality.length} users with personality field:`);
    
    if (usersWithPersonality.length > 0) {
      console.log('\n👥 Users with personality field:');
      usersWithPersonality.forEach(user => {
        console.log(`- ${user.username} (${user.email})`);
        console.log(`  Personality: "${user.personality}"`);
        console.log(`  MBTI: ${user.mbti || 'Not set'}`);
        console.log('');
      });

      console.log('⚠️  WARNING: These users still have personality data.');
      console.log('Consider migrating this data before removing the field from the schema.');
      
      // Option to migrate personality to mbti if mbti is not set
      const usersNeedingMigration = usersWithPersonality.filter(user => !user.mbti);
      if (usersNeedingMigration.length > 0) {
        console.log(`\n🔄 ${usersNeedingMigration.length} users could have their personality migrated to MBTI.`);
      }
    } else {
      console.log('\n✅ No users have personality field with data.');
      console.log('It is safe to remove the personality field from the User schema.');
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`\n📈 Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
checkPersonalityField();