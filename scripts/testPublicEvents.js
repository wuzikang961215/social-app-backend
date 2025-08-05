const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const publicEventService = require('../services/publicEventService');
const ExternalEvent = require('../models/ExternalEvent');

async function testPublicEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
    
    // Clear existing events first
    await ExternalEvent.deleteMany({});
    console.log('Cleared existing events\n');
    
    // Fetch new events
    console.log('Fetching events from public sources...\n');
    const count = await publicEventService.aggregateEvents();
    
    console.log(`\n✅ Aggregation completed. Total events saved: ${count}\n`);
    
    // Show sample events
    const events = await ExternalEvent.find()
      .sort({ time: 1 })
      .limit(10);
    
    console.log('Sample events:');
    console.log('─'.repeat(80));
    
    events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.titleZh || event.title}`);
      console.log(`   时间: ${event.timeFormatted}`);
      console.log(`   地点: ${event.location}`);
      console.log(`   来源: ${event.source}`);
      console.log(`   链接: ${event.link}`);
      if (event.description) {
        console.log(`   描述: ${event.descriptionZh || event.description}`.substring(0, 100) + '...');
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  }
}

testPublicEvents();