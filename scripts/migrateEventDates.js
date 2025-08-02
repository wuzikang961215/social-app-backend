const mongoose = require('mongoose');
const Event = require('../models/Event');

// MongoDB connection (update with your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

async function migrateEventDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all events
    const events = await Event.find({});
    console.log(`Found ${events.length} events to migrate`);

    for (const event of events) {
      // Convert UTC date back to local string
      // Assuming the dates were created in China timezone (UTC+8)
      const date = new Date(event.startTime);
      
      // Format as YYYY-MM-DDTHH:mm (local time string)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      console.log(`Event: ${event.title}`);
      console.log(`  Old time (UTC): ${event.startTime.toISOString()}`);
      console.log(`  New time (local): ${localTimeString}`);
      
      // Update the event with string time
      // Note: You'll need to update the schema first
    }

    console.log('\nMigration preview complete. Update the schema and uncomment save logic to apply.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
migrateEventDates();