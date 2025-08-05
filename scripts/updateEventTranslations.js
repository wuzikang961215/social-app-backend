const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const ExternalEvent = require('../models/ExternalEvent');

async function updateTranslations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all events
    const events = await ExternalEvent.find();
    console.log(`Found ${events.length} events`);

    for (const event of events) {
      console.log(`\nProcessing: ${event.title}`);
      
      // Mark fields as modified to trigger translation
      event.markModified('title');
      event.markModified('description');
      
      await event.save();
      
      console.log(`Title translated: ${event.titleTranslated}`);
      console.log(`Description translated: ${event.descriptionTranslated?.substring(0, 50)}...`);
    }

    console.log('\nAll events updated with translations!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateTranslations();