import ApiClient from '../shared/api-client.js';
import CONFIG from '../shared/constants.js';

const PENDING_REQUESTS_KEY = 'pendingRequests';
const { CHAT_HISTORY, LAST_RESULTS } = CONFIG.STORAGE_KEYS;
const activeControllers = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'transliterate',
    title: 'Transliterate to Persian',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'transliterate') {
    const selectedText = info.selectionText;
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showTransliterationOverlay,
        args: [selectedText]
      });
    } catch (err) {
      console.error('Failed to show overlay:', err);
    }
  }
});

function showTransliterationOverlay(text) {
  const existing = document.getElementById('transliterator-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'transliterator-overlay';
  overlay.innerHTML = `
    <div class="transliterator-modal">
      <div class="transliterator-header">
        <h3>Transliterate to Persian</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="transliterator-content">
        <div class="original-text">${text}</div>
        <div class="result-area">
          <div class="loading">Translating...</div>
        </div>
      </div>
      <div class="transliterator-actions">
        <button class="copy-btn">Copy Result</button>
        <button class="replace-btn">Replace Text</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.querySelector('.close-btn').addEventListener('click', () => {
    overlay.remove();
  });
  
  chrome.runtime.sendMessage({
    action: 'transliterate',
    text: text,
    language: 'fa'
  }).then(response => {
    const resultArea = overlay.querySelector('.result-area');
    if (response.success) {
      resultArea.innerHTML = `<div class="transliterated-text">${response.result}</div>`;
      
      overlay.querySelector('.copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(response.result);
        overlay.querySelector('.copy-btn').textContent = 'Copied!';
      });
      
      overlay.querySelector('.replace-btn').addEventListener('click', () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(response.result));
        }
        overlay.remove();
      });
    } else {
      resultArea.innerHTML = `<div class="error">Error: ${response.error}</div>`;
    }
  });
}

// Helper to save history entry
async function saveHistoryEntry(request, output) {
  const result = await chrome.storage.local.get([CHAT_HISTORY]);
  const history = result[CHAT_HISTORY] || [];
  history.unshift({ request, output: output.slice(0, 200), timestamp: Date.now() });
  if (history.length > 20) history.pop();
  await chrome.storage.local.set({ [CHAT_HISTORY]: history });
}

// Helper to save last results
async function saveLastResults(partial) {
  const result = await chrome.storage.local.get([LAST_RESULTS]);
  const current = result[LAST_RESULTS] || {};
  const next = { ...current, ...partial };
  await chrome.storage.local.set({ [LAST_RESULTS]: next });
}

// Helper to manage pending requests
async function setPendingRequest(id, data) {
  const result = await chrome.storage.local.get([PENDING_REQUESTS_KEY]);
  const pending = result[PENDING_REQUESTS_KEY] || {};
  pending[id] = { ...data, startedAt: Date.now(), status: 'pending' };
  await chrome.storage.local.set({ [PENDING_REQUESTS_KEY]: pending });
}

async function completePendingRequest(id, output, error = null) {
  const result = await chrome.storage.local.get([PENDING_REQUESTS_KEY]);
  const pending = result[PENDING_REQUESTS_KEY] || {};
  if (pending[id] && pending[id].status !== 'cancelled') {
    pending[id].status = error ? 'error' : 'completed';
    pending[id].output = output;
    pending[id].error = error;
    pending[id].completedAt = Date.now();
    await chrome.storage.local.set({ [PENDING_REQUESTS_KEY]: pending });
  }
}

async function cancelPendingRequest(id, reason = 'Cancelled by user') {
  const result = await chrome.storage.local.get([PENDING_REQUESTS_KEY]);
  const pending = result[PENDING_REQUESTS_KEY] || {};
  if (pending[id] && pending[id].status === 'pending') {
    pending[id].status = 'cancelled';
    pending[id].error = reason;
    pending[id].completedAt = Date.now();
    await chrome.storage.local.set({ [PENDING_REQUESTS_KEY]: pending });
  }
}

async function clearPendingRequest(id) {
  const result = await chrome.storage.local.get([PENDING_REQUESTS_KEY]);
  const pending = result[PENDING_REQUESTS_KEY] || {};
  delete pending[id];
  await chrome.storage.local.set({ [PENDING_REQUESTS_KEY]: pending });
}

// Handle popup requests that need to survive popup close
// port can be null when popup is closed or using non-streaming fallback
async function handlePopupConvert(requestId, text, isTranslate, language, port) {
  await setPendingRequest(requestId, { 
    type: 'transliterate', 
    input: text, 
    isTranslate,
    language 
  });
  
  const controller = new AbortController();
  activeControllers.set(requestId, controller);
  try {
    const client = new ApiClient();
    const streamOpts = {
      signal: controller.signal,
      onChunk: port ? (chunk, accumulated) => {
        try { port.postMessage({ type: 'chunk', requestId, chunk, accumulated }); } catch {}
      } : undefined
    };
    const result = isTranslate 
      ? await client.translate(text, language, streamOpts)
      : await client.transliterate(text, language, streamOpts);
    
    await completePendingRequest(requestId, result);
    await saveHistoryEntry(text, result);
    await saveLastResults({
      transliterate: { input: text, output: result, isTranslate, timestamp: Date.now() }
    });
    
    if (port) {
      try { port.postMessage({ type: 'done', requestId, result }); } catch {}
    }
    return { success: true, result, requestId };
  } catch (err) {
    if (err.name === 'AbortError') {
      await cancelPendingRequest(requestId);
      if (port) {
        try { port.postMessage({ type: 'cancelled', requestId }); } catch {}
      }
      return { success: false, cancelled: true, requestId };
    }
    await completePendingRequest(requestId, null, err.message);
    if (port) {
      try { port.postMessage({ type: 'error', requestId, error: err.message }); } catch {}
    }
    return { success: false, error: err.message, requestId };
  } finally {
    activeControllers.delete(requestId);
  }
}

async function handlePopupAscii(requestId, text, port) {
  await setPendingRequest(requestId, { 
    type: 'ascii', 
    input: text 
  });
  
  const controller = new AbortController();
  activeControllers.set(requestId, controller);
  try {
    const client = new ApiClient();
    const streamOpts = {
      signal: controller.signal,
      onChunk: port ? (chunk, accumulated) => {
        try { port.postMessage({ type: 'chunk', requestId, chunk, accumulated }); } catch {}
      } : undefined
    };
    const result = await client.generateAsciiArt(text, streamOpts);
    
    await completePendingRequest(requestId, result);
    await saveHistoryEntry(text, result);
    await saveLastResults({
      ascii: { input: text, output: result, timestamp: Date.now() }
    });
    
    if (port) {
      try { port.postMessage({ type: 'done', requestId, result }); } catch {}
    }
    return { success: true, result, requestId };
  } catch (err) {
    if (err.name === 'AbortError') {
      await cancelPendingRequest(requestId);
      if (port) {
        try { port.postMessage({ type: 'cancelled', requestId }); } catch {}
      }
      return { success: false, cancelled: true, requestId };
    }
    await completePendingRequest(requestId, null, err.message);
    if (port) {
      try { port.postMessage({ type: 'error', requestId, error: err.message }); } catch {}
    }
    return { success: false, error: err.message, requestId };
  } finally {
    activeControllers.delete(requestId);
  }
}

// Port-based streaming connection from popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'streaming') return;

  port.onMessage.addListener((msg) => {
    if (msg.action === 'popup-convert') {
      handlePopupConvert(msg.requestId, msg.text, msg.isTranslate, msg.language || 'fa', port);
    } else if (msg.action === 'popup-ascii') {
      handlePopupAscii(msg.requestId, msg.text, port);
    } else if (msg.action === 'cancel-pending-request') {
      const controller = activeControllers.get(msg.requestId);
      if (controller) controller.abort();
      cancelPendingRequest(msg.requestId);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'transliterate') {
    handleTransliteration(request.text, request.language)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'get-pending-requests') {
    chrome.storage.local.get([PENDING_REQUESTS_KEY]).then(result => {
      sendResponse(result[PENDING_REQUESTS_KEY] || {});
    });
    return true;
  }
  
  if (request.action === 'clear-pending-request') {
    clearPendingRequest(request.requestId).then(() => sendResponse({ success: true }));
    return true;
  }

  if (request.action === 'cancel-pending-request') {
    const controller = activeControllers.get(request.requestId);
    if (controller) controller.abort();
    cancelPendingRequest(request.requestId).then(() => sendResponse({ success: true }));
    return true;
  }
});

async function handleTransliteration(text, language) {
  const client = new ApiClient();
  return await client.transliterate(text, language);
}
