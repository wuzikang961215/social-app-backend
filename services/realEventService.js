const axios = require('axios');
const ExternalEvent = require('../models/ExternalEvent');

class RealEventService {
  constructor() {
    this.sources = [];
  }

  async fetchRealEvents() {
    console.log('Fetching real events with accurate times...');
    
    const results = await Promise.allSettled([
      this.fetchSydneyOperaHouseEvents(),
      this.fetchCityOfSydneyEvents(),
      this.fetchEventbritePublicEvents(),
      this.fetchTimeOutSydneyEvents()
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Source ${index} failed:`, result.reason);
      }
    });
  }

  // Sydney Opera House has a public API
  async fetchSydneyOperaHouseEvents() {
    try {
      console.log('Fetching Sydney Opera House events...');
      
      // Sydney Opera House provides JSON feed
      const response = await axios.get('https://www.sydneyoperahouse.com/bin/soh/performance-feed', {
        params: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      if (response.data && response.data.performances) {
        for (const perf of response.data.performances) {
          const eventData = {
            title: perf.title,
            titleZh: perf.title, // Will translate later
            description: perf.description || perf.shortDescription,
            descriptionZh: '', // Will translate
            time: new Date(perf.startDateTime),
            location: `${perf.venue}, Sydney Opera House`,
            link: `https://www.sydneyoperahouse.com${perf.url}`,
            source: 'Sydney Opera House',
            sourceEventId: perf.id,
            category: 'arts',
            isActive: true
          };

          await this.saveEvent(eventData);
        }
      }
    } catch (error) {
      console.error('Sydney Opera House API error:', error.message);
    }
  }

  // City of Sydney has public event data
  async fetchCityOfSydneyEvents() {
    try {
      console.log('Fetching City of Sydney events...');
      
      // What's On API endpoint
      const response = await axios.get('https://whatson.cityofsydney.nsw.gov.au/api/v1/events', {
        params: {
          'date_from': new Date().toISOString().split('T')[0],
          'date_to': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'limit': 50
        },
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        for (const event of response.data.data) {
          const eventData = {
            title: event.title,
            titleZh: event.title,
            description: event.description,
            descriptionZh: '',
            time: new Date(event.datetime_start),
            location: event.venue_name || event.location,
            link: event.url,
            source: 'City of Sydney',
            sourceEventId: event.id,
            category: this.categorizeEvent(event.title, event.description),
            isActive: true
          };

          await this.saveEvent(eventData);
        }
      }
    } catch (error) {
      console.error('City of Sydney API error:', error.message);
    }
  }

  // Eventbrite public RSS feed (no auth needed)
  async fetchEventbritePublicEvents() {
    try {
      console.log('Fetching Eventbrite public events...');
      
      // Eventbrite provides location-based RSS feeds
      const rssUrl = 'https://www.eventbrite.com.au/rss/organizer_list_events/5816874863';
      
      // Note: This would need an RSS parser library like 'rss-parser'
      // For now, showing the approach
      console.log('RSS feed parsing would go here');
      
    } catch (error) {
      console.error('Eventbrite RSS error:', error.message);
    }
  }

  // TimeOut Sydney API
  async fetchTimeOutSydneyEvents() {
    try {
      console.log('Fetching TimeOut Sydney events...');
      
      // TimeOut has a public API for events
      const response = await axios.get('https://www.timeout.com/api/v1/sydney/events', {
        params: {
          'start_date': new Date().toISOString(),
          'end_date': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          'limit': 30
        }
      });

      // Process events...
    } catch (error) {
      console.error('TimeOut API error:', error.message);
    }
  }

  async saveEvent(eventData) {
    try {
      // Format Chinese time
      const tempEvent = new ExternalEvent(eventData);
      eventData.timeFormatted = tempEvent.formatChineseTime();

      await ExternalEvent.findOneAndUpdate(
        { source: eventData.source, sourceEventId: eventData.sourceEventId },
        eventData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }

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
}

module.exports = new RealEventService();