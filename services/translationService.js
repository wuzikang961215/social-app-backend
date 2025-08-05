const axios = require('axios');

class TranslationService {
  constructor() {
    this.endpoint = 'https://api.cognitive.microsofttranslator.com';
    this.key = process.env.MICROSOFT_TRANSLATOR_KEY;
    this.region = process.env.TRANSLATOR_REGION || 'australiaeast'; // Default to Australia East region
  }

  async translateText(text, targetLanguage = 'zh-Hans') {
    // If no key configured, return original text
    if (!this.key || this.key === 'your_translator_key_here') {
      console.log('Translation API not configured');
      return text;
    }

    // Skip if text is already in Chinese
    if (this.isChinese(text)) {
      return text;
    }

    try {
      const response = await axios({
        baseURL: this.endpoint,
        url: '/translate',
        method: 'post',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-type': 'application/json',
          'X-ClientTraceId': this.generateTraceId()
        },
        params: {
          'api-version': '3.0',
          'from': 'en',
          'to': targetLanguage
        },
        data: [{
          'text': text
        }],
        responseType: 'json'
      });

      if (response.data && response.data[0] && response.data[0].translations[0]) {
        return response.data[0].translations[0].text;
      }
      
      return text;
    } catch (error) {
      console.error('Translation error:', error.response?.data || error.message);
      return text; // Return original text on error
    }
  }

  // Check if text contains Chinese characters
  isChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
  }

  // Generate unique trace ID for debugging
  generateTraceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Batch translate multiple texts
  async translateBatch(texts, targetLanguage = 'zh-Hans') {
    if (!this.key || texts.length === 0) {
      return texts;
    }

    try {
      const textsToTranslate = texts.map(text => ({ text }));
      
      const response = await axios({
        baseURL: this.endpoint,
        url: '/translate',
        method: 'post',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-type': 'application/json',
          'X-ClientTraceId': this.generateTraceId()
        },
        params: {
          'api-version': '3.0',
          'from': 'en',
          'to': targetLanguage
        },
        data: textsToTranslate,
        responseType: 'json'
      });

      if (response.data) {
        return response.data.map((item, index) => 
          item.translations[0]?.text || texts[index]
        );
      }
      
      return texts;
    } catch (error) {
      console.error('Batch translation error:', error.response?.data || error.message);
      return texts;
    }
  }
}

module.exports = new TranslationService();