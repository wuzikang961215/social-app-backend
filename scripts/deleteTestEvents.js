require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User'); // Need to require User model for populate

async function deleteTestEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all events (sorted by creation date, newest first)
    const allEvents = await Event.find({})
      .sort({ createdAt: -1 })
      .populate('creator', 'username')
      .limit(10); // Show only recent 10 events

    console.log('\n📋 Recent events:');
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" by ${event.creator.username} - Created: ${event.createdAt.toLocaleDateString()}`);
    });

    // Find test events (you can modify this query to match your test events)
    // For example, events with "test" in the title or specific criteria
    const testEvents = await Event.find({
      $or: [
        { title: /test/i }, // Case-insensitive search for "test" in title
        { title: /测试/i }, // Chinese for "test"
        { description: /test event/i }
      ]
    }).limit(3);

    if (testEvents.length === 0) {
      console.log('\n❌ No test events found. Looking for any events created by a specific user...');
      
      // Alternative: Delete the 3 most recent events (be careful!)
      console.log('\n⚠️  Would you like to delete the 3 most recent events instead? (This is irreversible!)');
      console.log('If yes, uncomment the code below and run again.');
      
      // Uncomment below to delete 3 most recent events
      /*
      const recentEvents = await Event.find({})
        .sort({ createdAt: -1 })
        .limit(3);
      
      console.log('\n🗑️  Deleting these events:');
      for (const event of recentEvents) {
        console.log(`- "${event.title}"`);
        await Event.findByIdAndDelete(event._id);
      }
      console.log('✅ Deleted 3 most recent events');
      */
      
    } else {
      console.log(`\n🗑️  Found ${testEvents.length} test events to delete:`);
      
      for (const event of testEvents) {
        console.log(`- "${event.title}" (ID: ${event._id})`);
        await Event.findByIdAndDelete(event._id);
      }
      
      console.log(`\n✅ Successfully deleted ${testEvents.length} test events`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
deleteTestEvents();