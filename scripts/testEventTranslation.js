const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const ExternalEvent = require('../models/ExternalEvent');

async function testTranslation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an event without translation
    const event = await ExternalEvent.findOne({
      $or: [
        { titleTranslated: { $exists: false } },
        { titleTranslated: null },
        { titleTranslated: '' },
        { descriptionTranslated: { $exists: false } },
        { descriptionTranslated: null },
        { descriptionTranslated: '' }
      ]
    });

    if (!event) {
      console.log('No events need translation');
      
      // Show all events
      const allEvents = await ExternalEvent.find().select('title titleTranslated description descriptionTranslated');
      console.log('\nAll events:');
      allEvents.forEach(e => {
        console.log(`\nTitle: ${e.title}`);
        console.log(`Translated: ${e.titleTranslated || 'Not translated'}`);
        console.log(`Description: ${e.description.substring(0, 50)}...`);
        console.log(`Translated: ${e.descriptionTranslated ? e.descriptionTranslated.substring(0, 50) + '...' : 'Not translated'}`);
      });
    } else {
      console.log('\nFound event needing translation:');
      console.log(`Title: ${event.title}`);
      console.log(`Description: ${event.description}`);
      
      // Trigger save to test translation
      console.log('\nTriggering translation...');
      await event.save();
      
      // Reload the event
      const updatedEvent = await ExternalEvent.findById(event._id);
      console.log('\nAfter translation:');
      console.log(`Title translated: ${updatedEvent.titleTranslated || 'Failed'}`);
      console.log(`Description translated: ${updatedEvent.descriptionTranslated || 'Failed'}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testTranslation();