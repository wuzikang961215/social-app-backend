const axios = require('axios');
const Parser = require('rss-parser');
const ExternalEvent = require('../models/ExternalEvent');

class PublicEventService {
  constructor() {
    this.rssParser = new Parser({
      customFields: {
        item: [
          ['eventbrite:startdate', 'eventStartDate'],
          ['eventbrite:enddate', 'eventEndDate'],
          ['eventbrite:venue', 'venue'],
          ['eventbrite:organizer', 'organizer']
        ]
      }
    });
  }

  async aggregateEvents() {
    console.log('Starting public event aggregation...');
    
    const results = await Promise.allSettled([
      this.fetchEventbriteRSS(),
      this.fetchCityOfSydneyEvents()
    ]);

    let totalEvents = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalEvents += result.value || 0;
      } else {
        console.error(`Source ${index} failed:`, result.reason);
      }
    });

    console.log(`Total events aggregated: ${totalEvents}`);
    return totalEvents;
  }

  // Eventbrite RSS Feed
  async fetchEventbriteRSS() {
    try {
      console.log('Fetching Eventbrite RSS feed...');
      
      // Try different Eventbrite RSS endpoints
      const rssUrls = [
        'https://www.eventbrite.com/rss/e/sydney-events',
        'https://www.eventbrite.com.au/rss/e/sydney',
        'https://www.eventbrite.com.au/d/australia--sydney/events/feed/',
        'https://rss.eventbrite.com/q/sydney/'
      ];
      
      let feed = null;
      for (const url of rssUrls) {
        try {
          feed = await this.rssParser.parseURL(url);
          console.log(`Successfully fetched from: ${url}`);
          break;
        } catch (e) {
          console.log(`Failed to fetch ${url}: ${e.message}`);
        }
      }
      
      if (!feed) {
        console.log('All Eventbrite RSS endpoints failed');
        return 0;
      }
      
      console.log(`Found ${feed.items.length} events from Eventbrite RSS`);
      
      let savedCount = 0;
      for (const item of feed.items) {
        try {
          // Extract event ID from URL
          const eventIdMatch = item.link.match(/e\/[\w-]+-(\d+)/);
          const eventId = eventIdMatch ? eventIdMatch[1] : item.guid;
          
          // Parse date from title or content
          let eventTime = new Date();
          if (item.eventStartDate) {
            eventTime = new Date(item.eventStartDate);
          } else {
            // Try to extract date from title like "Sat, Dec 14, 7:00 PM"
            const dateMatch = item.title.match(/(\w{3}, \w{3} \d{1,2}, \d{1,2}:\d{2} [AP]M)/);
            if (dateMatch) {
              eventTime = new Date(dateMatch[1] + ' ' + new Date().getFullYear());
            }
          }
          
          const eventData = {
            title: this.cleanEventbriteTitle(item.title),
            titleZh: '',
            description: this.cleanHTML(item.contentSnippet || item.content || ''),
            descriptionZh: '',
            time: eventTime,
            location: this.extractLocation(item),
            link: item.link,
            source: 'Eventbrite',
            sourceEventId: eventId,
            category: this.categorizeEvent(item.title, item.content || ''),
            isActive: true
          };

          // Format time
          const tempEvent = new ExternalEvent(eventData);
          eventData.timeFormatted = tempEvent.formatChineseTime();

          // Basic translation
          eventData.titleZh = await this.basicTranslate(eventData.title);
          eventData.descriptionZh = await this.basicTranslate(eventData.description.substring(0, 200));

          await ExternalEvent.findOneAndUpdate(
            { source: 'Eventbrite', sourceEventId: eventId },
            eventData,
            { upsert: true, new: true }
          );
          
          savedCount++;
        } catch (err) {
          console.error('Error saving Eventbrite event:', err.message);
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('Eventbrite RSS error:', error.message);
      return 0;
    }
  }

  // City of Sydney Events API
  async fetchCityOfSydneyEvents() {
    try {
      console.log('Fetching City of Sydney events...');
      
      // City of Sydney What's On API - try different endpoints
      const apiUrls = [
        'https://whatson.cityofsydney.nsw.gov.au/api/search/events',
        'https://www.cityofsydney.nsw.gov.au/explore/whats-on/events.json',
        'https://whatson.cityofsydney.nsw.gov.au/events.json'
      ];
      
      let response = null;
      for (const url of apiUrls) {
        try {
          response = await axios.get(url, {
            params: {
              sort: 'date',
              page: 1,
              pageSize: 50
            },
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 5000
          });
          console.log(`Successfully fetched from: ${url}`);
          break;
        } catch (e) {
          console.log(`Failed to fetch ${url}: ${e.message}`);
        }
      }
      
      if (!response) {
        throw new Error('All City of Sydney endpoints failed');
      }

      const events = response.data?.events || response.data?.data || [];
      console.log(`Found ${events.length} events from City of Sydney`);
      
      let savedCount = 0;
      for (const event of events) {
        try {
          const eventData = {
            title: event.title || event.name,
            titleZh: '',
            description: this.cleanHTML(event.description || event.summary || ''),
            descriptionZh: '',
            time: new Date(event.occurrences?.[0]?.start || event.startDate || event.date),
            location: this.getCityOfSydneyLocation(event),
            link: event.permalink || event.url || `https://whatson.cityofsydney.nsw.gov.au/events/${event.id}`,
            source: 'City of Sydney',
            sourceEventId: event.id || event.slug,
            category: event.primaryCategory?.toLowerCase() || this.categorizeEvent(event.title, event.description || ''),
            isActive: true,
            
            // Extra metadata
            metadata: {
              image: event.image?.url || event.featuredImage,
              venue: event.venue?.name,
              address: event.venue?.address,
              price: event.price || 'Free',
              bookingUrl: event.bookingUrl
            }
          };

          // Skip if event is in the past
          if (eventData.time < new Date()) {
            continue;
          }

          // Format time
          const tempEvent = new ExternalEvent(eventData);
          eventData.timeFormatted = tempEvent.formatChineseTime();

          // Translation
          eventData.titleZh = await this.basicTranslate(eventData.title);
          eventData.descriptionZh = await this.basicTranslate(eventData.description.substring(0, 200));

          await ExternalEvent.findOneAndUpdate(
            { source: 'City of Sydney', sourceEventId: eventData.sourceEventId },
            eventData,
            { upsert: true, new: true }
          );
          
          savedCount++;
        } catch (err) {
          console.error('Error saving City of Sydney event:', err.message);
        }
      }
      
      return savedCount;
    } catch (error) {
      console.error('City of Sydney API error:', error.message);
      
      // Try alternative endpoint
      return this.fetchCityOfSydneyAlternative();
    }
  }

  // Alternative City of Sydney endpoint
  async fetchCityOfSydneyAlternative() {
    try {
      console.log('Trying alternative City of Sydney endpoint...');
      
      const response = await axios.get('https://www.cityofsydney.nsw.gov.au/api/v1/events/search', {
        params: {
          date_from: new Date().toISOString().split('T')[0],
          date_to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      const events = response.data?.results || [];
      console.log(`Found ${events.length} events from alternative endpoint`);
      
      // Process events similar to above...
      return events.length;
    } catch (error) {
      console.error('Alternative endpoint also failed:', error.message);
      return 0;
    }
  }

  // Helper methods
  cleanEventbriteTitle(title) {
    // Remove date from title as it's often duplicated
    return title.replace(/\s*-\s*\w{3}, \w{3} \d{1,2}, \d{1,2}:\d{2} [AP]M.*$/, '').trim();
  }

  cleanHTML(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractLocation(item) {
    if (item.venue) return item.venue;
    
    // Try to extract from content
    const content = item.content || item.contentSnippet || '';
    const locationMatch = content.match(/Location: ([^<\n]+)/i);
    if (locationMatch) return locationMatch[1].trim();
    
    // Default
    return 'Sydney';
  }

  getCityOfSydneyLocation(event) {
    if (event.venue) {
      const parts = [
        event.venue.name,
        event.venue.address,
        event.venue.suburb || 'Sydney'
      ].filter(Boolean);
      return parts.join(', ');
    }
    
    return event.location || event.address || 'Sydney';
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/music|concert|band|dj|live|gig|jazz|classical/)) return 'music';
    if (text.match(/sport|fitness|yoga|running|cycling|gym|swim/)) return 'sports';
    if (text.match(/food|dining|restaurant|cooking|wine|beer|taste/)) return 'food';
    if (text.match(/art|gallery|exhibition|museum|paint|sculpture|creative/)) return 'arts';
    if (text.match(/market|shopping|craft|handmade|vintage/)) return 'market';
    if (text.match(/family|kids|children|playground/)) return 'family';
    if (text.match(/workshop|class|learn|education|course/)) return 'education';
    if (text.match(/networking|business|startup|entrepreneur/)) return 'business';
    
    return 'other';
  }

  async basicTranslate(text) {
    if (!text) return '';
    
    let translated = text;
    
    const translations = {
      'Sydney': '悉尼',
      'Free': '免费',
      'Free event': '免费活动',
      'Market': '市场',
      'Night Market': '夜市',
      'Food': '美食',
      'Festival': '节',
      'Music': '音乐',
      'Concert': '音乐会',
      'Art': '艺术',
      'Exhibition': '展览',
      'Workshop': '工作坊',
      'Family': '家庭',
      'Kids': '儿童',
      'Christmas': '圣诞',
      'New Year': '新年',
      'Lunar New Year': '春节',
      'Chinese New Year': '春节',
      'Saturday': '周六',
      'Sunday': '周日',
      'Weekend': '周末',
      'Morning': '早上',
      'Evening': '晚上',
      'Night': '夜晚',
      'Harbour': '海港',
      'Beach': '海滩',
      'Park': '公园',
      'Library': '图书馆',
      'Museum': '博物馆',
      'Gallery': '画廊',
      'Theatre': '剧院',
      'Cinema': '电影院'
    };

    for (const [eng, chn] of Object.entries(translations)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      translated = translated.replace(regex, chn);
    }

    return translated;
  }
}

module.exports = new PublicEventService();