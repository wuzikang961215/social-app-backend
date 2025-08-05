const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const ExternalEvent = require('../models/ExternalEvent');

async function cleanupOldEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Delete events that ended more than 7 days ago
    const result = await ExternalEvent.deleteMany({
      time: { $lt: sevenDaysAgo }
    });

    console.log(`Deleted ${result.deletedCount} old events`);
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupOldEvents();