const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config();

async function deleteTestEvent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find events with "test" in the title (case insensitive)
    const testEvents = await Event.find({ 
      title: { $regex: /test/i } 
    });

    if (testEvents.length === 0) {
      console.log('No test events found');
      return;
    }

    console.log(`Found ${testEvents.length} test event(s):`);
    testEvents.forEach(event => {
      console.log(`- "${event.title}" (ID: ${event._id})`);
    });

    // Delete the test events
    const result = await Event.deleteMany({ 
      title: { $regex: /test/i } 
    });

    console.log(`\nDeleted ${result.deletedCount} test event(s)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

deleteTestEvent();