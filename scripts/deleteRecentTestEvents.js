const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config();

async function deleteRecentTestEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete the specific test events we just created
    const testEventTitles = [
      "周末爬山看日出",
      "密室逃脱 - 侦探主题",
      "周日 Brunch + 逛市集",
      "羽毛球运动局",
      "Board Game Night 桌游夜",
      "海边BBQ烧烤派对",
      "摄影walk - 探索悉尼小巷"
    ];

    const result = await Event.deleteMany({ 
      title: { $in: testEventTitles } 
    });

    console.log(`Deleted ${result.deletedCount} test event(s)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

deleteRecentTestEvents();