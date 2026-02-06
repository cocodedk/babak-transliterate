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

  async transliterate(text, languageCode, options = {}) {
    return this._convert(text, languageCode, 'TRANSLITERATE', options);
  }

  async translate(text, languageCode, options = {}) {
    return this._convert(text, languageCode, 'TRANSLATE', options);
  }

  async _convert(text, languageCode, mode, options = {}) {
    const creds = await this.getDecryptedCredentials();
    const langName = CONFIG.LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
    const headers = this.buildHeaders(creds);
    const prompt = CONFIG.PROMPTS[mode](text, langName);
    
    return this._fetchStreaming(creds, headers, [{ role: 'user', content: prompt }], 0.3, options);
  }

  async generateAsciiArt(request, options = {}) {
    const creds = await this.getDecryptedCredentials();
    const headers = this.buildHeaders(creds);
    
    return this._fetchStreaming(creds, headers, [{ role: 'user', content: CONFIG.PROMPTS.ASCII_ART(request) }], 0.7, options);
  }

  async _fetchStreaming(creds, headers, messages, temperature, options = {}) {
    const { signal, onChunk } = options;
    const useStream = typeof onChunk === 'function';

    const response = await fetch(creds.apiUrl, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model: creds.apiModel,
        messages,
        temperature,
        stream: useStream
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (!useStream) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') break;

        try {
          const parsed = JSON.parse(payload);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            onChunk(content, accumulated);
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    return accumulated.trim();
  }
}

export default ApiClient;
