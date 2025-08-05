const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const eventAggregatorService = require('../services/eventAggregatorService');

async function testAggregation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    // Run aggregation
    console.log('Starting event aggregation test...');
    await eventAggregatorService.aggregateEvents();
    
    // Check results
    const ExternalEvent = require('../models/ExternalEvent');
    const events = await ExternalEvent.find().sort({ time: 1 }).limit(10);
    
    console.log(`\nFound ${events.length} events in database:`);
    events.forEach(event => {
      console.log(`- ${event.titleZh || event.title} | ${event.timeFormatted} | ${event.source}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  }
}

testAggregation();