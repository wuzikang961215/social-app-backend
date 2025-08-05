const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const ExternalEvent = require('../models/ExternalEvent');

async function updateJazzEvent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const event = await ExternalEvent.findOne({ title: 'Jazz Ensembles' });
    
    if (event) {
      // Update to a more descriptive title that will translate better
      event.title = 'Jazz Music Concert - UNSW Ensembles';
      event.titleTranslated = '爵士音乐会 - 新南威尔士大学乐团';
      
      await event.save();
      
      console.log('Event updated successfully');
      console.log(`New title: ${event.title}`);
      console.log(`Translated: ${event.titleTranslated}`);
    } else {
      console.log('Event not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateJazzEvent();