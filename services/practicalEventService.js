const axios = require('axios');
const ExternalEvent = require('../models/ExternalEvent');

class PracticalEventService {
  async aggregateEvents() {
    console.log('Starting practical event aggregation...');
    
    // OPTION 1: Facebook Events API (requires app review)
    // - Very accurate, real-time
    // - Covers most Sydney events
    // - Need Facebook App with "Page Public Content Access"
    
    // OPTION 2: Google Calendar API
    // - Many venues have public calendars
    // - Free and accurate
    await this.fetchGoogleCalendarEvents();
    
    // OPTION 3: Meetup API (requires Pro subscription)
    // - $35/month for API access
    // - Excellent for tech and social events
    await this.fetchMeetupEvents();
    
    // OPTION 4: Web scraping with permission
    // - Contact venues for permission
    // - Use Puppeteer for dynamic content
    
    // OPTION 5: Partner directly with venues
    // - Email Sydney venues for API access
    // - Many are happy to share event data
  }

  async fetchGoogleCalendarEvents() {
    // Example: Sydney Opera House public calendar
    const CALENDAR_IDS = {
      'Sydney Opera House': 'sydneyoperahouse.com_2d3433373231353136363330@resource.calendar.google.com',
      'City of Sydney': 'sydney.nsw.gov.au_events@group.calendar.google.com',
      // Add more public calendar IDs
    };

    // Note: Requires Google Calendar API key
    const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
    if (!API_KEY) {
      console.log('Google Calendar API key not configured');
      return;
    }

    for (const [venue, calendarId] of Object.entries(CALENDAR_IDS)) {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            params: {
              key: API_KEY,
              timeMin: new Date().toISOString(),
              timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              singleEvents: true,
              orderBy: 'startTime'
            }
          }
        );

        if (response.data.items) {
          for (const item of response.data.items) {
            const eventData = {
              title: item.summary,
              description: item.description || '',
              time: new Date(item.start.dateTime || item.start.date),
              location: item.location || venue,
              link: item.htmlLink,
              source: venue,
              sourceEventId: item.id,
              category: 'various',
              isActive: true
            };

            await this.saveEvent(eventData);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${venue} calendar:`, error.message);
      }
    }
  }

  async fetchMeetupEvents() {
    // Meetup GraphQL API (requires Pro subscription)
    if (!process.env.MEETUP_API_KEY) {
      console.log('Meetup API key not configured');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.meetup.com/gql',
        {
          query: `
            query {
              searchEvents(
                filter: {
                  lat: -33.8688,
                  lon: 151.2093,
                  radius: 30,
                  startDateRange: "${new Date().toISOString()}",
                  endDateRange: "${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}"
                }
                first: 50
              ) {
                edges {
                  node {
                    id
                    title
                    description
                    dateTime
                    venue {
                      name
                      address
                    }
                    eventUrl
                    group {
                      name
                    }
                  }
                }
              }
            }
          `
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.MEETUP_API_KEY}`
          }
        }
      );

      // Process Meetup events...
    } catch (error) {
      console.error('Meetup API error:', error.message);
    }
  }

  async saveEvent(eventData) {
    try {
      const tempEvent = new ExternalEvent(eventData);
      eventData.timeFormatted = tempEvent.formatChineseTime();
      eventData.titleZh = await this.translateText(eventData.title);
      eventData.descriptionZh = await this.translateText(eventData.description.substring(0, 200));

      await ExternalEvent.findOneAndUpdate(
        { source: eventData.source, sourceEventId: eventData.sourceEventId },
        eventData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }

  async translateText(text) {
    // Use Microsoft Translator or Google Translate API
    return text; // Placeholder
  }
}

module.exports = new PracticalEventService();