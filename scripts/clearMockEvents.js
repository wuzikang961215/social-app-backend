const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ExternalEvent = require('../models/ExternalEvent');

async function clearMockEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    // Delete all mock events
    const mockSources = [
      'Sydney Opera House',
      'Bondi Events', 
      'Sydney Food Festival',
      'Art Gallery NSW',
      'Meetup'
    ];
    
    const result = await ExternalEvent.deleteMany({
      source: { $in: mockSources }
    });
    
    console.log(`Deleted ${result.deletedCount} mock events`);
    
    // Show remaining events
    const remaining = await ExternalEvent.find().sort({ time: 1 });
    console.log(`\nRemaining ${remaining.length} events:`);
    remaining.forEach(event => {
      console.log(`- ${event.titleZh || event.title} | ${event.source}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

clearMockEvents();