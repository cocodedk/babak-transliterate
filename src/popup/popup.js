import ApiClient from '../shared/api-client.js';
import HistoryPanel from './history-panel.js';
import { saveDraftInput, loadDraftInputs, clearDraftInput } from './popup-storage.js';
import { restoreResults } from './restore-results.js';

class PopupApp {
  constructor() {
    this.apiClient = null;
    this.history = new HistoryPanel('chat-history');
    this.draftSaveTimers = {};
    this.activeRequests = new Map();
    this.isDetached = this.checkIfDetached();
    this.init();
  }

  checkIfDetached() {
    // Check if we're in a detached window (opened via window.open or as a tab)
    const isDetached = new URLSearchParams(window.location.search).has('detached') ||
                       window.opener !== null ||
                       window.location.href.includes('?detached');
    if (isDetached) {
      document.body.classList.add('detached-window');
    }
    return isDetached;
  }

  async init() {
    this.setupEventListeners();
    this.populateAboutInfo();
    try {
      this.apiClient = new ApiClient();
    } catch (err) {
      console.log('API client not initialized - settings needed');
    }
    await this.history.refresh();
    await this.restoreDrafts();
    await this.checkPendingRequests();
    await restoreResults({
      updateModeUI: this.updateModeUI.bind(this),
      setStatus: this.setResultStatus.bind(this)
    });
  }

  // Restore draft inputs from storage
  async restoreDrafts() {
    const drafts = await loadDraftInputs();
    
    if (drafts.transliterateInput) {
      document.getElementById('transliterate-input').value = drafts.transliterateInput;
    }
    if (drafts.asciiInput) {
      document.getElementById('ascii-input').value = drafts.asciiInput;
    }
    if (typeof drafts.translateMode === 'boolean') {
      document.getElementById('translate-mode').checked = drafts.translateMode;
      this.updateModeUI();
    }
  }

  // Check for pending/completed requests from background
  async checkPendingRequests() {
    try {
      const pending = await chrome.runtime.sendMessage({ action: 'get-pending-requests' });
      
      for (const [requestId, data] of Object.entries(pending)) {
        if (data.status === 'completed') {
          // Show completed result
          this.showCompletedRequest(data);
          // Clear from pending
          await chrome.runtime.sendMessage({ action: 'clear-pending-request', requestId });
        } else if (data.status === 'error') {
          // Show error
          this.showErrorRequest(data);
          await chrome.runtime.sendMessage({ action: 'clear-pending-request', requestId });
        } else if (data.status === 'cancelled') {
          this.showCancelledRequest(data);
          await chrome.runtime.sendMessage({ action: 'clear-pending-request', requestId });
        } else if (data.status === 'pending') {
          // Request still in progress, show loading state
          this.showPendingRequest(requestId, data);
        }
      }
    } catch (err) {
      console.log('Could not check pending requests:', err);
    }
  }

  showCompletedRequest(data) {
    if (data.type === 'transliterate') {
      const input = document.getElementById('transliterate-input');
      const output = document.getElementById('transliterate-result');
      const area = document.getElementById('transliterate-result-area');
      
      input.value = data.input;
      output.textContent = data.output;
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('transliterate-status', '', false);
      this.clearActiveRequest('transliterate');
    } else if (data.type === 'ascii') {
      const input = document.getElementById('ascii-input');
      const output = document.getElementById('ascii-result');
      const area = document.getElementById('result-area');
      
      input.value = data.input;
      output.textContent = data.output;
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('ascii-status', '', false);
      this.clearActiveRequest('ascii');
    }
    // Refresh history to show the new entry
    this.history.refresh();
  }

  showErrorRequest(data) {
    if (data.type === 'transliterate') {
      const output = document.getElementById('transliterate-result');
      const area = document.getElementById('transliterate-result-area');
      
      output.textContent = `Error: ${data.error}`;
      output.style.color = '#ef4444';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('transliterate-status', '', false);
      this.clearActiveRequest('transliterate');
      setTimeout(() => output.style.color = '', 3000);
    } else if (data.type === 'ascii') {
      const output = document.getElementById('ascii-result');
      const area = document.getElementById('result-area');
      
      output.textContent = `Error: ${data.error}`;
      output.style.color = '#ef4444';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('ascii-status', '', false);
      this.clearActiveRequest('ascii');
      setTimeout(() => output.style.color = '', 3000);
    }
  }

  showCancelledRequest(data) {
    if (data.type === 'transliterate') {
      const output = document.getElementById('transliterate-result');
      const area = document.getElementById('transliterate-result-area');
      
      output.textContent = 'Cancelled.';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('transliterate-status', 'Cancelled', false);
      this.clearActiveRequest('transliterate');
    } else if (data.type === 'ascii') {
      const output = document.getElementById('ascii-result');
      const area = document.getElementById('result-area');
      
      output.textContent = 'Cancelled.';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('ascii-status', 'Cancelled', false);
      this.clearActiveRequest('ascii');
    }
  }

  showPendingRequest(requestId, data) {
    if (data.type === 'transliterate') {
      const input = document.getElementById('transliterate-input');
      const btn = document.getElementById('transliterate-btn');
      const output = document.getElementById('transliterate-result');
      const area = document.getElementById('transliterate-result-area');
      
      input.value = data.input;
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = data.isTranslate ? 'Translating...' : 'Transliterating...';
      output.textContent = 'Request in progress...';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'true');
      this.setResultStatus('transliterate-status', 'Waiting for response', true);
      this.setActiveRequest('transliterate', requestId);
    } else if (data.type === 'ascii') {
      const input = document.getElementById('ascii-input');
      const btn = document.getElementById('generate-btn');
      const output = document.getElementById('ascii-result');
      const area = document.getElementById('result-area');
      
      input.value = data.input;
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = 'Generating...';
      output.textContent = 'Request in progress...';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'true');
      this.setResultStatus('ascii-status', 'Waiting for response', true);
      this.setActiveRequest('ascii', requestId);
    }
  }

  // Debounced save for draft inputs
  saveDraftDebounced(key, value) {
    if (this.draftSaveTimers[key]) {
      clearTimeout(this.draftSaveTimers[key]);
    }
    this.draftSaveTimers[key] = setTimeout(() => {
      saveDraftInput(key, value);
    }, 300);
  }

  setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    document.querySelector('.settings-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    const aboutBtn = document.querySelector('.about-btn');
    const aboutClose = document.getElementById('about-close');
    const aboutModal = document.getElementById('about-modal');
    if (aboutBtn && aboutModal) {
      aboutBtn.addEventListener('click', () => this.openAbout());
    }
    if (aboutClose && aboutModal) {
      aboutClose.addEventListener('click', () => this.closeAbout());
    }
    if (aboutModal) {
      aboutModal.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
          this.closeAbout();
        }
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeAbout();
      }
    });

    this.history.bindClearButton('clear-history-btn');

    // Detach button - opens popup in a standalone window
    const detachBtn = document.querySelector('.detach-btn');
    if (detachBtn) {
      detachBtn.addEventListener('click', () => this.detachPopup());
    }

    this.setupTransliterateEvents();
    this.setupAsciiEvents();
  }

  setActiveRequest(type, requestId) {
    if (requestId) {
      this.activeRequests.set(type, requestId);
    } else {
      this.activeRequests.delete(type);
    }
    this.toggleStopButton(type, Boolean(requestId));
  }

  clearActiveRequest(type) {
    this.setActiveRequest(type, null);
  }

  toggleStopButton(type, isActive) {
    const id = type === 'transliterate' ? 'stop-transliterate-btn' : 'stop-ascii-btn';
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('hidden', !isActive);
  }

  async cancelRequest(type) {
    const requestId = this.activeRequests.get(type);
    if (!requestId) return;

    try {
      // Cancel works via both sendMessage (for pending check) and the streaming port handles it via its own listener
      await chrome.runtime.sendMessage({ action: 'cancel-pending-request', requestId });
      await chrome.runtime.sendMessage({ action: 'clear-pending-request', requestId });
    } catch (err) {
      console.log('Cancel request failed:', err);
    }

    if (type === 'transliterate') {
      const btn = document.getElementById('transliterate-btn');
      const output = document.getElementById('transliterate-result');
      const area = document.getElementById('transliterate-result-area');
      const isTranslate = document.getElementById('translate-mode').checked;
      
      output.textContent = 'Cancelled.';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('transliterate-status', 'Cancelled', false);
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = isTranslate ? 'Translate to Persian' : 'Transliterate to Persian';
    } else if (type === 'ascii') {
      const btn = document.getElementById('generate-btn');
      const output = document.getElementById('ascii-result');
      const area = document.getElementById('result-area');
      
      output.textContent = 'Cancelled.';
      area.classList.remove('hidden');
      area.setAttribute('aria-busy', 'false');
      this.setResultStatus('ascii-status', 'Cancelled', false);
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Generate Art';
    }

    this.clearActiveRequest(type);
  }

  populateAboutInfo() {
    const manifest = chrome?.runtime?.getManifest?.();
    if (!manifest) return;

    const nameEl = document.getElementById('about-name');
    const descriptionEl = document.getElementById('about-description');
    const versionEl = document.getElementById('about-version');

    if (nameEl && manifest.name) {
      nameEl.textContent = manifest.name;
    }
    if (descriptionEl && manifest.description) {
      descriptionEl.textContent = manifest.description;
    }
    if (versionEl && manifest.version) {
      versionEl.textContent = manifest.version;
    }
  }

  openAbout() {
    const modal = document.getElementById('about-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeAbout() {
    const modal = document.getElementById('about-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  detachPopup() {
    // Get the popup URL with detached flag
    const popupUrl = chrome.runtime.getURL('popup/popup.html?detached=true');
    
    // Open in a new window with reasonable dimensions
    chrome.windows.create({
      url: popupUrl,
      type: 'popup',
      width: 420,
      height: 600,
      focused: true
    });
    
    // Close the current popup
    window.close();
  }

  setupTransliterateEvents() {
    const btn = document.getElementById('transliterate-btn');
    const input = document.getElementById('transliterate-input');
    const modeToggle = document.getElementById('translate-mode');
    const stopBtn = document.getElementById('stop-transliterate-btn');

    btn.addEventListener('click', () => this.convertText());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.convertText();
      }
    });

    // Auto-save input as user types
    input.addEventListener('input', () => {
      this.saveDraftDebounced('transliterateInput', input.value);
    });

    modeToggle.addEventListener('change', () => {
      this.updateModeUI();
      saveDraftInput('translateMode', modeToggle.checked);
    });

    document.getElementById('copy-transliterate-btn').addEventListener('click', () => {
      const result = document.getElementById('transliterate-result').textContent;
      navigator.clipboard.writeText(result);
      const copyBtn = document.getElementById('copy-transliterate-btn');
      copyBtn.textContent = '✓';
      setTimeout(() => copyBtn.textContent = '📋', 1500);
    });

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.cancelRequest('transliterate'));
    }
  }

  updateModeUI() {
    const isTranslate = document.getElementById('translate-mode').checked;
    const btn = document.getElementById('transliterate-btn');
    btn.querySelector('.btn-text').textContent = isTranslate ? 'Translate to Persian' : 'Transliterate to Persian';
  }

  setupAsciiEvents() {
    const btn = document.getElementById('generate-btn');
    const input = document.getElementById('ascii-input');
    const stopBtn = document.getElementById('stop-ascii-btn');

    btn.addEventListener('click', () => this.generateAsciiArt());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.generateAsciiArt();
      }
    });

    // Auto-save input as user types
    input.addEventListener('input', () => {
      this.saveDraftDebounced('asciiInput', input.value);
    });

    document.getElementById('copy-btn').addEventListener('click', () => {
      const result = document.getElementById('ascii-result').textContent;
      navigator.clipboard.writeText(result);
      const btn = document.getElementById('copy-btn');
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = '📋', 1500);
    });

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.cancelRequest('ascii'));
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  checkApiConfigured(output, area) {
    if (!this.apiClient) {
      output.textContent = 'Please configure API settings first. Click the ⚙️ button.';
      output.style.color = '#f59e0b';
      area.classList.remove('hidden');
      return false;
    }
    return true;
  }

  // Open a streaming port to the background script
  _openStreamingPort() {
    const port = chrome.runtime.connect({ name: 'streaming' });
    return port;
  }

  // Generic streaming request handler
  _streamRequest({ port, requestId, type, outputEl, areaEl, btnEl, btnDoneText, statusId, reasoningEl, draftKey, onDone }) {
    return new Promise((resolve) => {
      let receivedFirst = false;

      // Reset reasoning display for this task
      if (reasoningEl) {
        reasoningEl.textContent = '';
        reasoningEl.classList.add('hidden');
      }

      port.onMessage.addListener((msg) => {
        if (msg.requestId !== requestId) return;

        if (msg.type === 'reasoning') {
          // Model is thinking — show reasoning tokens live
          this.setResultStatus(statusId, 'Thinking...', true);
          if (reasoningEl) {
            reasoningEl.classList.remove('hidden');
            reasoningEl.textContent = msg.accumulated;
            // Auto-scroll to bottom so latest reasoning lines are visible
            reasoningEl.scrollTop = reasoningEl.scrollHeight;
          }
        } else if (msg.type === 'chunk') {
          if (!receivedFirst) {
            receivedFirst = true;
            outputEl.textContent = '';
            this.setResultStatus(statusId, 'Streaming...', true);
            // Collapse reasoning when real content starts
            if (reasoningEl && !reasoningEl.classList.contains('hidden')) {
              reasoningEl.classList.add('collapsed');
            }
          }
          outputEl.textContent = msg.accumulated;
        } else if (msg.type === 'done') {
          outputEl.textContent = msg.result;
          areaEl.setAttribute('aria-busy', 'false');
          this.setResultStatus(statusId, '', false);
          btnEl.disabled = false;
          btnEl.querySelector('.btn-text').textContent = btnDoneText;
          this.clearActiveRequest(type);
          // Hide reasoning on completion
          if (reasoningEl) {
            reasoningEl.classList.add('hidden');
            reasoningEl.classList.remove('collapsed');
            reasoningEl.textContent = '';
          }
          if (onDone) onDone(msg.result);
          try { port.disconnect(); } catch {}
          resolve({ success: true, result: msg.result });
        } else if (msg.type === 'error') {
          outputEl.textContent = `Error: ${msg.error}`;
          outputEl.style.color = '#ef4444';
          areaEl.setAttribute('aria-busy', 'false');
          this.setResultStatus(statusId, '', false);
          btnEl.disabled = false;
          btnEl.querySelector('.btn-text').textContent = btnDoneText;
          this.clearActiveRequest(type);
          if (reasoningEl) {
            reasoningEl.classList.add('hidden');
            reasoningEl.classList.remove('collapsed');
            reasoningEl.textContent = '';
          }
          setTimeout(() => outputEl.style.color = '', 3000);
          try { port.disconnect(); } catch {}
          resolve({ success: false, error: msg.error });
        } else if (msg.type === 'cancelled') {
          this.showCancelledRequest({ type });
          btnEl.disabled = false;
          btnEl.querySelector('.btn-text').textContent = btnDoneText;
          if (reasoningEl) {
            reasoningEl.classList.add('hidden');
            reasoningEl.classList.remove('collapsed');
            reasoningEl.textContent = '';
          }
          try { port.disconnect(); } catch {}
          resolve({ success: false, cancelled: true });
        }
      });

      port.onDisconnect.addListener(() => {
        // Port disconnected (e.g. background restart) — resolve to avoid hanging
        resolve({ success: false, error: 'Connection lost' });
      });
    });
  }

  async convertText() {
    const input = document.getElementById('transliterate-input');
    const btn = document.getElementById('transliterate-btn');
    const area = document.getElementById('transliterate-result-area');
    const output = document.getElementById('transliterate-result');
    const isTranslate = document.getElementById('translate-mode').checked;

    const text = input.value.trim();
    if (!text) return;
    if (!this.checkApiConfigured(output, area)) return;

    const modeLabel = isTranslate ? 'Translate' : 'Transliterate';
    const requestId = `transliterate-${Date.now()}`;
    this.setActiveRequest('transliterate', requestId);
    
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = isTranslate ? 'Translating...' : 'Transliterating...';
    output.textContent = `Converting to Persian (${modeLabel.toLowerCase()})...`;
    area.classList.remove('hidden');
    area.setAttribute('aria-busy', 'true');
    this.setResultStatus('transliterate-status', 'Waiting for response', true);

    const port = this._openStreamingPort();
    port.postMessage({
      action: 'popup-convert',
      requestId,
      text,
      isTranslate,
      language: 'fa'
    });

    await this._streamRequest({
      port,
      requestId,
      type: 'transliterate',
      outputEl: output,
      areaEl: area,
      btnEl: btn,
      btnDoneText: `${modeLabel} to Persian`,
      statusId: 'transliterate-status',
      reasoningEl: document.getElementById('transliterate-reasoning'),
      draftKey: 'transliterateInput',
      onDone: async () => {
        await this.history.refresh();
        await clearDraftInput('transliterateInput');
      }
    });
  }

  async generateAsciiArt() {
    const input = document.getElementById('ascii-input');
    const btn = document.getElementById('generate-btn');
    const area = document.getElementById('result-area');
    const output = document.getElementById('ascii-result');

    const request = input.value.trim();
    if (!request) return;
    if (!this.checkApiConfigured(output, area)) return;

    const requestId = `ascii-${Date.now()}`;
    this.setActiveRequest('ascii', requestId);
    
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Generating...';
    output.textContent = 'Creating your ASCII masterpiece...';
    area.classList.remove('hidden');
    area.setAttribute('aria-busy', 'true');
    this.setResultStatus('ascii-status', 'Waiting for response', true);

    const port = this._openStreamingPort();
    port.postMessage({
      action: 'popup-ascii',
      requestId,
      text: request
    });

    await this._streamRequest({
      port,
      requestId,
      type: 'ascii',
      outputEl: output,
      areaEl: area,
      btnEl: btn,
      btnDoneText: 'Generate Art',
      statusId: 'ascii-status',
      reasoningEl: document.getElementById('ascii-reasoning'),
      draftKey: 'asciiInput',
      onDone: async () => {
        await this.history.refresh();
        await clearDraftInput('asciiInput');
      }
    });
  }

  setResultStatus(id, message, isLoading) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('loading', Boolean(isLoading));
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupApp());
