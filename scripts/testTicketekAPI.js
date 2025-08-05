const axios = require('axios');

async function testTicketekAPI() {
  try {
    // Ticketek has public endpoints for events
    console.log('Testing Ticketek public API...\n');
    
    // Search Sydney events
    const response = await axios.get('https://premier.ticketek.com.au/api/search/events', {
      params: {
        'location': 'Sydney',
        'dateFrom': new Date().toISOString().split('T')[0],
        'dateTo': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'pageSize': 10
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.message);
    
    // Alternative: Try their public website API
    try {
      console.log('\nTrying alternative endpoint...');
      const alt = await axios.get('https://www.ticketek.com.au/api/events/findevents', {
        params: {
          'keyword': 'Sydney'
        }
      });
      console.log('Alternative response:', alt.data);
    } catch (altError) {
      console.error('Alternative also failed:', altError.message);
    }
  }
}

testTicketekAPI();