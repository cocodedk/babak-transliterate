import ScriptCipher from '../shared/script-cipher.js';

class OptionsPage {
  constructor() {
    this.cipher = new ScriptCipher();
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSettings();
  }

  setupEventListeners() {
    document.getElementById('save-btn').addEventListener('click', () => this.saveSettings());
    document.getElementById('test-btn').addEventListener('click', () => this.testConnection());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearSettings());
    
    this.setupToggle('toggle-key', 'api-key');
    this.setupToggle('toggle-encryption', 'encryption-key');
  }
  
  async clearSettings() {
    if (!confirm('Are you sure you want to clear all settings?')) return;
    await chrome.storage.local.clear();
    this.showStatus('✅ All settings cleared', 'success');
    await this.loadSettings();
  }

  setupToggle(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    
    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      'apiUrl', 'apiKey', 'encryptionKey', 'defaultLanguage', 'apiModel', 'httpReferer', 'xTitle'
    ]);

    const hasSettings = result.apiUrl && result.apiKey;
    const statusEl = document.getElementById('storage-status');
    statusEl.style.display = hasSettings ? 'none' : 'flex';

    document.getElementById('api-url').value = result.apiUrl || '';
    document.getElementById('encryption-key').placeholder = result.encryptionKey ? 
      'Passphrase saved (enter to change)' : 'Enter encryption passphrase';
    document.getElementById('default-language').value = result.defaultLanguage || 'fa';
    document.getElementById('api-model').value = result.apiModel || '';
    document.getElementById('http-referer').value = result.httpReferer || '';
    document.getElementById('x-title').value = result.xTitle || '';
    document.getElementById('api-key').value = '';
    document.getElementById('api-key').placeholder = result.apiKey ? 'API key saved (encrypted)' : 'Enter API key';
    document.getElementById('encryption-key').value = '';
  }

  async saveSettings() {
    const apiUrl = document.getElementById('api-url').value;
    const apiKey = document.getElementById('api-key').value;
    const apiModel = document.getElementById('api-model').value || 'openai/gpt-3.5-turbo';
    const encryptionKey = document.getElementById('encryption-key').value;
    const defaultLanguage = document.getElementById('default-language').value;
    const httpReferer = document.getElementById('http-referer').value;
    const xTitle = document.getElementById('x-title').value;

    const saved = await chrome.storage.local.get(['apiKey', 'encryptionKey']);
    const hasExistingKey = saved.apiKey && saved.encryptionKey;

    // Need passphrase if: new API key entered, or no existing settings
    if (!encryptionKey && (apiKey || !hasExistingKey)) {
      return this.showStatus('Please enter encryption passphrase', 'error');
    }
    if (!apiUrl) return this.showStatus('Please enter API URL', 'error');

    try {
      const dataToSave = { apiUrl, apiModel, defaultLanguage, httpReferer, xTitle };

      // Encrypt and save new API key if provided
      if (apiKey && encryptionKey) {
        dataToSave.apiKey = this.cipher.encrypt(apiKey, encryptionKey);
        dataToSave.encryptionKey = encryptionKey;
      }

      await chrome.storage.local.set(dataToSave);
      document.getElementById('api-key').value = '';
      document.getElementById('api-key').placeholder = 'API key saved (encrypted)';
      document.getElementById('encryption-key').value = '';
      this.showStatus('✅ Settings saved!', 'success');
    } catch (err) {
      this.showStatus(`❌ Error: ${err.message}`, 'error');
    }
  }

  async testConnection() {
    const apiUrl = document.getElementById('api-url').value;
    const apiKeyInput = document.getElementById('api-key').value;
    
    // Load saved settings
    const saved = await chrome.storage.local.get(['apiUrl', 'apiKey', 'encryptionKey', 'apiModel', 'httpReferer', 'xTitle']);
    
    // Use form URL or saved URL
    const url = apiUrl || saved.apiUrl;
    if (!url) return this.showStatus('Please enter API URL', 'error');
    
    // Use form API key (plaintext) or decrypt saved key
    let key = apiKeyInput;
    if (!key && saved.apiKey && saved.encryptionKey) {
      key = this.cipher.decrypt(saved.apiKey, saved.encryptionKey);
      if (!key) return this.showStatus('Failed to decrypt API key', 'error');
    }
    if (!key) return this.showStatus('No API key. Please save settings first.', 'error');

    await this.doTestConnection(url, key, 
      document.getElementById('api-model').value || saved.apiModel || 'openai/gpt-3.5-turbo',
      (document.getElementById('http-referer').value || saved.httpReferer || '').replace(/[^\x00-\xFF]/g, ''),
      (document.getElementById('x-title').value || saved.xTitle || '').replace(/[^\x00-\xFF]/g, ''));
  }
  
  async doTestConnection(apiUrl, apiKey, apiModel, httpReferer, xTitle) {
    const testBtn = document.getElementById('test-btn');
    testBtn.disabled = true;
    testBtn.textContent = '🔄 Testing...';

    try {
      const safeApiKey = this.sanitizeHeaderValue(apiKey);
      if (!safeApiKey || safeApiKey !== apiKey) {
        this.showStatus('API key contains unsupported characters. Please re-enter it.', 'error');
        return;
      }

      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${safeApiKey}` };
      const safeReferer = this.sanitizeHeaderValue(httpReferer);
      const safeTitle = this.sanitizeHeaderValue(xTitle);
      if (safeReferer) headers['HTTP-Referer'] = safeReferer;
      if (safeTitle) headers['X-Title'] = safeTitle;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ model: apiModel, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
      });

      this.showStatus(response.ok ? '✅ Connection successful!' : `❌ API Error: ${response.status}`, 
        response.ok ? 'success' : 'error');
    } catch (err) {
      console.error('Connection error:', err);
      this.showStatus(`❌ Connection failed: ${err.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '🧪 Test Connection';
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    setTimeout(() => {
      statusEl.className = 'status-message';
    }, 5000);
  }

  sanitizeHeaderValue(value) {
    if (!value) return '';
    return String(value)
      .replace(/[^\x00-\xFF]/g, '')
      .replace(/[\r\n]/g, '');
  }
}

document.addEventListener('DOMContentLoaded', () => new OptionsPage());
