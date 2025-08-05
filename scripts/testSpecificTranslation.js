const dotenv = require('dotenv');
dotenv.config();

const translationService = require('../services/translationService');

async function testTranslations() {
  console.log('Testing specific translations...\n');

  const testTexts = [
    'Jazz Ensembles',
    'Concert at Sydney Opera House',
    'Free yoga session',
    'Art Exhibition Opening'
  ];

  for (const text of testTexts) {
    console.log(`Original: "${text}"`);
    const translated = await translationService.translateText(text);
    console.log(`Translated: "${translated}"`);
    console.log(`Changed: ${translated !== text}\n`);
  }
}

testTranslations();