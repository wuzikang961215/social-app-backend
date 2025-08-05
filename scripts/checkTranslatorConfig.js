const dotenv = require('dotenv');
dotenv.config();

console.log('=== Microsoft Translator API Configuration Check ===\n');

// Check if API key is set
const apiKey = process.env.MICROSOFT_TRANSLATOR_KEY;
const region = process.env.TRANSLATOR_REGION;

console.log('1. API Key Status:');
if (!apiKey) {
  console.log('   ❌ MICROSOFT_TRANSLATOR_KEY not found in .env');
  console.log('   → Add MICROSOFT_TRANSLATOR_KEY=your_key_here to your .env file');
} else if (apiKey === 'your_translator_key_here') {
  console.log('   ❌ API key is still the placeholder value');
  console.log('   → Replace with your actual Microsoft Translator API key');
} else {
  console.log('   ✅ API key is configured');
  console.log(`   → Key length: ${apiKey.length} characters`);
  console.log(`   → Key preview: ${apiKey.substring(0, 8)}...`);
}

console.log('\n2. Region Configuration:');
if (!region) {
  console.log('   ⚠️  TRANSLATOR_REGION not set in .env');
  console.log('   → Will use default: australiaeast');
  console.log('   → Common regions: australiaeast, eastus, westus, westeurope');
} else {
  console.log(`   ✅ Region configured: ${region}`);
}

console.log('\n3. To fix authentication issues:');
console.log('   a) Go to Azure Portal → Translator resource');
console.log('   b) Check your resource region (e.g., "Australia East")');
console.log('   c) Copy your API key from "Keys and Endpoint" section');
console.log('   d) Update your .env file:');
console.log('      MICROSOFT_TRANSLATOR_KEY=your_actual_key_here');
console.log('      TRANSLATOR_REGION=australiaeast  (or your actual region)');

console.log('\n4. Valid Azure regions for Translator:');
console.log('   - australiaeast, australiasoutheast');
console.log('   - eastus, eastus2, westus, westus2, westus3');
console.log('   - canadacentral, canadaeast');
console.log('   - westeurope, northeurope');
console.log('   - japaneast, japanwest');
console.log('   - and many more...\n');

// Test the endpoint
console.log('5. Testing API connection...');
const axios = require('axios');

async function testConnection() {
  if (!apiKey || apiKey === 'your_translator_key_here') {
    console.log('   ⏭️  Skipping API test - valid key required');
    return;
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=zh-Hans',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region || 'australiaeast',
        'Content-type': 'application/json'
      },
      data: [{
        'text': 'Hello'
      }]
    });
    console.log('   ✅ API connection successful!');
    console.log(`   → Translation: "Hello" → "${response.data[0].translations[0].text}"`);
  } catch (error) {
    console.log('   ❌ API connection failed');
    if (error.response?.status === 401) {
      console.log('   → Invalid API key or region mismatch');
    } else if (error.response?.status === 403) {
      console.log('   → Access denied - check subscription status');
    } else {
      console.log(`   → Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

testConnection();