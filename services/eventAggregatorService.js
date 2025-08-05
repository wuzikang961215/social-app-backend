const ExternalEvent = require('../models/ExternalEvent');
const axios = require('axios');

class EventAggregatorService {
  constructor() {
    this.sources = {
      // We'll add real API integrations here later
      // For now, using mock data
    };
  }

  // Main method to fetch and update events
  async aggregateEvents() {
    console.log('Starting event aggregation...');
    
    try {
      // Use the new public event service
      const publicEventService = require('./publicEventService');
      await publicEventService.aggregateEvents();
      
      console.log('Event aggregation completed');
    } catch (error) {
      console.error('Event aggregation failed:', error);
    }
  }


  // Fetch events from Eventbrite
  async fetchEventbriteEvents() {
    if (!process.env.EVENTBRITE_TOKEN || process.env.EVENTBRITE_TOKEN === 'your_eventbrite_private_token_here') {
      console.log('Eventbrite token not configured, skipping...');
      return;
    }

    try {
      console.log('Fetching Eventbrite events...');
      
      // NOTE: Eventbrite's API requires either:
      // 1. Event IDs (for fetching specific events you already know)
      // 2. Organization-level access (for fetching your own events)
      // 3. Platform/Partner access (for public event discovery)
      
      // Your current token is a personal token which cannot discover public events
      // To fetch Sydney events, you would need:
      // - Eventbrite Platform Partnership: https://www.eventbrite.com/platform/
      // - Or use their public website/RSS feeds
      
      console.log('Note: Current Eventbrite token is personal - cannot discover public events');
      console.log('Consider applying for Eventbrite Platform access for full event discovery');
      
      // For now, return empty as we can't search public events
      return;
    } catch (error) {
      console.error('Error fetching Eventbrite events:', error.response?.data || error.message);
    }
  }

  // Helper to categorize events based on title/description
  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/music|concert|band|dj|live|gig|festival/)) return 'music';
    if (text.match(/sport|football|basketball|tennis|run|swim|gym|fitness/)) return 'sports';
    if (text.match(/food|restaurant|dinner|lunch|taste|wine|beer|cafe/)) return 'food';
    if (text.match(/art|gallery|exhibition|museum|paint|sculpture/)) return 'arts';
    if (text.match(/networking|meetup|social|party|gathering/)) return 'social';
    if (text.match(/tech|code|programming|startup|digital/)) return 'tech';
    
    return 'other';
  }

  // Translate events to Chinese
  async translateEvents() {
    if (!process.env.MICROSOFT_TRANSLATOR_KEY || process.env.MICROSOFT_TRANSLATOR_KEY === 'your_translator_key_here') {
      console.log('Translation API not configured, using basic translation...');
      await this.basicTranslation();
      return;
    }

    try {
      const untranslatedEvents = await ExternalEvent.find({
        $or: [
          { titleZh: { $exists: false } },
          { titleZh: null },
          { descriptionZh: { $exists: false } },
          { descriptionZh: null }
        ]
      }).limit(10); // Limit to avoid API limits

      console.log(`Found ${untranslatedEvents.length} events to translate`);

      for (const event of untranslatedEvents) {
        try {
          // For now, use basic translation
          await this.translateSingleEvent(event);
        } catch (err) {
          console.error(`Error translating event ${event.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  }

  // Basic translation without API (for demonstration)
  async basicTranslation() {
    const untranslatedEvents = await ExternalEvent.find({
      $or: [
        { titleZh: { $exists: false } },
        { titleZh: null }
      ]
    });

    for (const event of untranslatedEvents) {
      // Basic keyword translation
      let titleZh = event.title;
      titleZh = titleZh.replace(/Sydney/gi, '悉尼');
      titleZh = titleZh.replace(/Concert/gi, '音乐会');
      titleZh = titleZh.replace(/Festival/gi, '节');
      titleZh = titleZh.replace(/Food/gi, '美食');
      titleZh = titleZh.replace(/Art/gi, '艺术');
      titleZh = titleZh.replace(/Exhibition/gi, '展览');
      titleZh = titleZh.replace(/Market/gi, '市场');
      titleZh = titleZh.replace(/Beach/gi, '海滩');
      titleZh = titleZh.replace(/Park/gi, '公园');
      
      let descZh = event.description.substring(0, 200);
      descZh = descZh.replace(/Sydney/gi, '悉尼');
      descZh = descZh.replace(/free/gi, '免费');
      descZh = descZh.replace(/ticket/gi, '门票');
      
      event.titleZh = titleZh;
      event.descriptionZh = descZh;
      await event.save();
    }
  }

  // Translate single event (placeholder for API implementation)
  async translateSingleEvent(event) {
    // This would use Microsoft Translator API
    // For now, just do basic translation
    event.titleZh = event.title;
    event.descriptionZh = event.description.substring(0, 200);
    await event.save();
  }

  // Fetch Sydney events using alternative sources
  async fetchSydneyEventsFromWeb() {
    try {
      console.log('Fetching Sydney events from alternative sources...');
      
      // Since most event APIs require authentication, let's add some realistic mock events
      // In production, you would:
      // 1. Apply for Eventbrite Platform Partnership
      // 2. Use Meetup Pro API
      // 3. Scrape public event websites (with permission)
      // 4. Use RSS feeds from event sites
      
      // NOTE: These are real Sydney activities, but times are placeholders
      // To get real event times, you would need:
      // 1. Official API access from each provider
      // 2. Web scraping (with permission)
      // 3. RSS feeds or public calendars
      
      const realWorldEvents = [
        {
          title: "Sydney Harbour Bridge Climb - Daily Tours",
          titleZh: "悉尼海港大桥攀登 - 每日团",
          description: "Multiple daily climb sessions available. Check website for exact times and bookings",
          descriptionZh: "每天多个攀登时段可选。请查看网站了解具体时间和预订",
          time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          location: "Sydney Harbour Bridge",
          link: "https://www.bridgeclimb.com",
          source: "BridgeClimb",
          category: "experience"
        },
        {
          title: "Chinatown Night Markets",
          titleZh: "唐人街夜市",
          description: "Friday nights 4-11pm. Check website for seasonal schedule",
          descriptionZh: "周五晚上4-11点。请查看网站了解季节性时间表",
          time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          location: "Dixon Street, Chinatown",
          link: "https://www.sydney.com/destinations/sydney/sydney-city/chinatown",
          source: "Chinatown Markets",
          category: "food"
        },
        {
          title: "Morning Exercise Classes - Hyde Park",
          titleZh: "海德公园晨练课程",
          description: "Various morning fitness activities. Check City of Sydney website for schedule",
          descriptionZh: "各种晨练健身活动。请查看悉尼市政府网站了解时间表",
          time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          location: "Hyde Park",
          link: "https://whatson.cityofsydney.nsw.gov.au/",
          source: "City of Sydney",
          category: "sports"
        },
        {
          title: "Sydney Opera House - What's On",
          titleZh: "悉尼歌剧院 - 演出信息",
          description: "Various performances daily. Visit website for current schedule and tickets",
          descriptionZh: "每日各类演出。访问网站查看当前演出时间表和购票",
          time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          location: "Sydney Opera House",
          link: "https://www.sydneyoperahouse.com/whats-on",
          source: "Sydney Opera House",
          category: "music"
        },
        {
          title: "Bondi to Coogee Coastal Walk",
          titleZh: "邦迪到库吉海岸步道",
          description: "Open daily, sunrise to sunset. 6km scenic coastal walk",
          descriptionZh: "每日开放，日出到日落。6公里风景海岸步道",
          time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          location: "Bondi Beach to Coogee Beach",
          link: "https://www.sydney.com/things-to-do/beach-lifestyle/bondi-to-coogee-walk",
          source: "Sydney Coastal Walks",
          category: "outdoor"
        },
        {
          title: "Visit Sydney - Events Calendar",
          titleZh: "访问悉尼 - 活动日历",
          description: "Comprehensive guide to Sydney events. Check for current festivals and activities",
          descriptionZh: "悉尼活动综合指南。查看当前节日和活动",
          time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          location: "Various Sydney Locations",
          link: "https://www.sydney.com/things-to-do/whats-on",
          source: "Sydney.com",
          category: "various"
        }
      ];

      console.log(`Adding ${realWorldEvents.length} curated Sydney events`);
      
      for (const event of realWorldEvents) {
        try {
          // Format time
          const tempEvent = new ExternalEvent(event);
          event.timeFormatted = tempEvent.formatChineseTime();
          event.sourceEventId = event.title.toLowerCase().replace(/\s+/g, '-');
          
          // Save to database
          await ExternalEvent.findOneAndUpdate(
            { source: event.source, sourceEventId: event.sourceEventId },
            event,
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error(`Error saving event:`, err);
        }
      }
      
    } catch (error) {
      console.error('Error in fetchSydneyEventsFromWeb:', error);
    }
  }
}

module.exports = new EventAggregatorService();