const dotenv = require('dotenv');
dotenv.config();

const translationService = require('../services/translationService');

async function testTranslation() {
  console.log('Testing Microsoft Translator API...\n');
  console.log('API Key:', process.env.MICROSOFT_TRANSLATOR_KEY ? 'Configured' : 'Not configured');
  console.log('Key length:', process.env.MICROSOFT_TRANSLATOR_KEY?.length);
  
  const testTexts = [
    'Sydney Opera House Concert',
    'Experience world-class music performance',
    'Free outdoor yoga session at Bondi Beach'
  ];
  
  for (const text of testTexts) {
    console.log(`\nOriginal: "${text}"`);
    try {
      const translated = await translationService.translateText(text);
      console.log(`Translated: "${translated}"`);
      console.log(`Success: ${translated !== text}`);
    } catch (error) {
      console.error('Translation error:', error.message);
    }
  }
  
  // Test if the API endpoint is reachable
  console.log('\nTesting API endpoint directly...');
  const axios = require('axios');
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=zh-Hans',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_TRANSLATOR_KEY,
        'Content-type': 'application/json'
      },
      data: [{
        'text': 'Hello world'
      }]
    });
    console.log('Direct API response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Direct API error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('\n❌ Authentication failed - check your API key');
    } else if (error.response?.status === 403) {
      console.error('\n❌ Access denied - check your subscription and region');
    }
  }
}

testTranslation();