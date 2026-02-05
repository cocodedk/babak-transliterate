import CONFIG from './constants.js';
import ScriptCipher from './script-cipher.js';

class ApiClient {
  constructor() {
    this.cipher = new ScriptCipher();
  }

  async getDecryptedCredentials() {
    const result = await chrome.storage.local.get([
      'apiUrl', 'apiKey', 'encryptionKey', 'apiModel', 'httpReferer', 'xTitle'
    ]);
    
    if (!result.apiUrl || !result.apiKey || !result.encryptionKey) {
      throw new Error('API credentials not configured');
    }
    
    // Decrypt the API key
    const apiKey = this.cipher.decrypt(result.apiKey, result.encryptionKey);
    if (!apiKey) {
      throw new Error('Failed to decrypt API key');
    }
    
    return { 
      apiUrl: result.apiUrl, 
      apiKey, 
      apiModel: result.apiModel || 'openai/gpt-3.5-turbo', 
      httpReferer: result.httpReferer, 
      xTitle: result.xTitle 
    };
  }
  
  buildHeaders(creds) {
    const safeApiKey = this.sanitizeHeaderValue(creds.apiKey);
    if (!safeApiKey || safeApiKey !== creds.apiKey) {
      throw new Error('API key contains unsupported characters. Please re-enter it in settings.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${safeApiKey}`
    };
    
    if (creds.httpReferer) {
      const safeReferer = this.sanitizeHeaderValue(creds.httpReferer);
      if (safeReferer) headers['HTTP-Referer'] = safeReferer;
    }
    if (creds.xTitle) {
      const safeTitle = this.sanitizeHeaderValue(creds.xTitle);
      if (safeTitle) headers['X-Title'] = safeTitle;
    }
    
    return headers;
  }

  sanitizeHeaderValue(value) {
    if (!value) return '';
    return String(value)
      .replace(/[^\x00-\xFF]/g, '')
      .replace(/[\r\n]/g, '');
  }

  async transliterate(text, languageCode) {
    return this._convert(text, languageCode, 'TRANSLITERATE');
  }

  async translate(text, languageCode) {
    return this._convert(text, languageCode, 'TRANSLATE');
  }

  async _convert(text, languageCode, mode) {
    const creds = await this.getDecryptedCredentials();
    const langName = CONFIG.LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
    const headers = this.buildHeaders(creds);
    const prompt = CONFIG.PROMPTS[mode](text, langName);
    
    const response = await fetch(creds.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: creds.apiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateAsciiArt(request) {
    const creds = await this.getDecryptedCredentials();
    const headers = this.buildHeaders(creds);
    
    const response = await fetch(creds.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: creds.apiModel,
        messages: [{
          role: 'user',
          content: CONFIG.PROMPTS.ASCII_ART(request)
        }],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}

export default ApiClient;
