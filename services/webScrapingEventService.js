const axios = require('axios');
const cheerio = require('cheerio');
const ExternalEvent = require('../models/ExternalEvent');

class WebScrapingEventService {
  async aggregateEvents() {
    console.log('Starting web scraping event aggregation...');
    
    const results = await Promise.allSettled([
      this.scrapeTimeOutSydney(),
      this.scrapeSydneyDotCom(),
      this.scrapeConcretePlayground()
    ]);

    let totalEvents = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalEvents += result.value || 0;
      } else {
        console.error(`Source ${index} failed:`, result.reason);
      }
    });

    console.log(`Total events scraped: ${totalEvents}`);
    return totalEvents;
  }

  // Time Out Sydney - they have a predictable URL structure
  async scrapeTimeOutSydney() {
    try {
      console.log('Scraping Time Out Sydney...');
      
      const response = await axios.get('https://www.timeout.com/sydney/things-to-do/things-to-do-in-sydney-this-week', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      let savedCount = 0;

      // Time Out has a specific structure for event listings
      $('.card-content, ._card_content').each(async (index, element) => {
        try {
          const title = $(element).find('h3, .card-title').text().trim();
          const link = $(element).find('a').attr('href');
          const description = $(element).find('.card-description, .summary').text().trim();
          
          if (title && link) {
            const eventData = {
              title: title,
              titleZh: await this.basicTranslate(title),
              description: description || title,
              descriptionZh: await this.basicTranslate(description || title),
              time: this.parseTimeFromText(description) || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              location: this.extractLocation(description) || 'Sydney',
              link: link.startsWith('http') ? link : `https://www.timeout.com${link}`,
              source: 'Time Out Sydney',
              sourceEventId: `timeout-${index}`,
              category: this.categorizeEvent(title, description),
              isActive: true
            };

            const tempEvent = new ExternalEvent(eventData);
            eventData.timeFormatted = tempEvent.formatChineseTime();

            await ExternalEvent.findOneAndUpdate(
              { source: 'Time Out Sydney', sourceEventId: eventData.sourceEventId },
              eventData,
              { upsert: true, new: true }
            );
            
            savedCount++;
          }
        } catch (err) {
          console.error('Error saving Time Out event:', err.message);
        }
      });

      return savedCount;
    } catch (error) {
      console.error('Time Out Sydney scraping error:', error.message);
      return 0;
    }
  }

  // Sydney.com events
  async scrapeSydneyDotCom() {
    try {
      console.log('Scraping Sydney.com...');
      
      const response = await axios.get('https://www.sydney.com/things-to-do/events', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      let savedCount = 0;

      // Sydney.com event structure
      $('.event-item, .listing-item').each(async (index, element) => {
        try {
          const title = $(element).find('.title, h3').text().trim();
          const link = $(element).find('a').attr('href');
          const date = $(element).find('.date, .event-date').text().trim();
          const venue = $(element).find('.venue, .location').text().trim();
          
          if (title) {
            const eventData = {
              title: title,
              titleZh: await this.basicTranslate(title),
              description: `${title} at ${venue}`,
              descriptionZh: await this.basicTranslate(`${title} 在 ${venue}`),
              time: this.parseDateString(date) || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              location: venue || 'Sydney',
              link: link ? `https://www.sydney.com${link}` : 'https://www.sydney.com/things-to-do/events',
              source: 'Sydney.com',
              sourceEventId: `sydney-${index}`,
              category: this.categorizeEvent(title, ''),
              isActive: true
            };

            const tempEvent = new ExternalEvent(eventData);
            eventData.timeFormatted = tempEvent.formatChineseTime();

            await ExternalEvent.findOneAndUpdate(
              { source: 'Sydney.com', sourceEventId: eventData.sourceEventId },
              eventData,
              { upsert: true, new: true }
            );
            
            savedCount++;
          }
        } catch (err) {
          console.error('Error saving Sydney.com event:', err.message);
        }
      });

      return savedCount;
    } catch (error) {
      console.error('Sydney.com scraping error:', error.message);
      return 0;
    }
  }

  // Concrete Playground - hip events for young people
  async scrapeConcretePlayground() {
    try {
      console.log('Scraping Concrete Playground...');
      
      const response = await axios.get('https://concreteplayground.com/sydney/event', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      let savedCount = 0;

      $('.event-card, .article-card').each(async (index, element) => {
        try {
          const title = $(element).find('.title, h3').text().trim();
          const link = $(element).find('a').attr('href');
          const dates = $(element).find('.dates, .date').text().trim();
          const location = $(element).find('.location, .venue').text().trim();
          
          if (title && link) {
            const eventData = {
              title: title,
              titleZh: await this.basicTranslate(title),
              description: title,
              descriptionZh: await this.basicTranslate(title),
              time: this.parseDateString(dates) || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              location: location || 'Sydney',
              link: link.startsWith('http') ? link : `https://concreteplayground.com${link}`,
              source: 'Concrete Playground',
              sourceEventId: `concrete-${index}`,
              category: this.categorizeEvent(title, ''),
              isActive: true
            };

            const tempEvent = new ExternalEvent(eventData);
            eventData.timeFormatted = tempEvent.formatChineseTime();

            await ExternalEvent.findOneAndUpdate(
              { source: 'Concrete Playground', sourceEventId: eventData.sourceEventId },
              eventData,
              { upsert: true, new: true }
            );
            
            savedCount++;
          }
        } catch (err) {
          console.error('Error saving Concrete Playground event:', err.message);
        }
      });

      return savedCount;
    } catch (error) {
      console.error('Concrete Playground scraping error:', error.message);
      return 0;
    }
  }

  // Helper methods
  parseTimeFromText(text) {
    // Try to extract dates from text
    const patterns = [
      /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i,
      /tonight/i,
      /tomorrow/i,
      /this weekend/i
    ];

    // Basic implementation - would need more sophisticated parsing
    const now = new Date();
    if (text.match(/tonight/i)) return new Date(now.setHours(20, 0, 0));
    if (text.match(/tomorrow/i)) return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (text.match(/this weekend/i)) {
      const daysUntilSaturday = (6 - now.getDay()) % 7;
      return new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
    }

    return null;
  }

  parseDateString(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Try direct parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
      
      // Try common formats
      // "Dec 25", "25 December", etc.
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const match = dateStr.toLowerCase().match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
      if (match) {
        const day = parseInt(match[1]);
        const month = monthNames.indexOf(match[2]);
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      }
    } catch (e) {
      // Fallback
    }
    
    return null;
  }

  extractLocation(text) {
    // Common Sydney venues
    const venues = [
      'Opera House', 'Darling Harbour', 'Circular Quay', 'Hyde Park',
      'Bondi Beach', 'Manly', 'Newtown', 'Surry Hills', 'Paddington',
      'Chinatown', 'The Rocks', 'Barangaroo', 'Pyrmont'
    ];

    for (const venue of venues) {
      if (text.toLowerCase().includes(venue.toLowerCase())) {
        return venue;
      }
    }

    return null;
  }

  categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/music|concert|band|dj|live|gig|jazz|classical/)) return 'music';
    if (text.match(/sport|fitness|yoga|running|cycling|gym|swim/)) return 'sports';
    if (text.match(/food|dining|restaurant|cooking|wine|beer|taste|eat/)) return 'food';
    if (text.match(/art|gallery|exhibition|museum|paint|sculpture/)) return 'arts';
    if (text.match(/market|shopping|craft|handmade|vintage/)) return 'market';
    if (text.match(/family|kids|children|playground/)) return 'family';
    if (text.match(/party|club|bar|drinks|nightlife/)) return 'nightlife';
    
    return 'other';
  }

  async basicTranslate(text) {
    if (!text) return '';
    
    let translated = text;
    
    const translations = {
      'Sydney': '悉尼',
      'Free': '免费',
      'Market': '市场',
      'Festival': '节',
      'Music': '音乐',
      'Concert': '音乐会',
      'Art': '艺术',
      'Exhibition': '展览',
      'Food': '美食',
      'Beach': '海滩',
      'Park': '公园',
      'Opera House': '歌剧院',
      'Harbour': '海港',
      'Bridge': '大桥',
      'Tonight': '今晚',
      'Tomorrow': '明天',
      'Weekend': '周末',
      'Christmas': '圣诞',
      'New Year': '新年'
    };

    for (const [eng, chn] of Object.entries(translations)) {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      translated = translated.replace(regex, chn);
    }

    return translated;
  }
}

module.exports = new WebScrapingEventService();