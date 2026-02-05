import CONFIG from '../shared/constants.js';

const { CHAT_HISTORY, LAST_RESULTS } = CONFIG.STORAGE_KEYS;
const PENDING_REQUESTS_KEY = 'pendingRequests';
const DRAFT_INPUTS_KEY = 'draftInputs';

export async function loadHistory() {
  const result = await chrome.storage.local.get([CHAT_HISTORY]);
  return result[CHAT_HISTORY] || [];
}

export async function saveHistoryEntry(request, output) {
  const history = await loadHistory();
  history.unshift({ request, output: output.slice(0, 200), timestamp: Date.now() });
  if (history.length > 20) history.pop();
  await chrome.storage.local.set({ [CHAT_HISTORY]: history });
  return history;
}

export async function deleteHistoryEntry(timestamp) {
  const history = await loadHistory();
  const next = history.filter(item => item.timestamp !== timestamp);
  await chrome.storage.local.set({ [CHAT_HISTORY]: next });
  return next;
}

export async function clearHistory() {
  await chrome.storage.local.set({ [CHAT_HISTORY]: [] });
  return [];
}

export async function loadLastResults() {
  const result = await chrome.storage.local.get([LAST_RESULTS]);
  return result[LAST_RESULTS] || {};
}

export async function saveLastResults(partial) {
  const current = await loadLastResults();
  const next = { ...current, ...partial };
  await chrome.storage.local.set({ [LAST_RESULTS]: next });
  return next;
}

// Draft inputs - saved as user types
export async function loadDraftInputs() {
  const result = await chrome.storage.local.get([DRAFT_INPUTS_KEY]);
  return result[DRAFT_INPUTS_KEY] || {};
}

export async function saveDraftInput(key, value) {
  const drafts = await loadDraftInputs();
  drafts[key] = value;
  await chrome.storage.local.set({ [DRAFT_INPUTS_KEY]: drafts });
}

export async function clearDraftInput(key) {
  const drafts = await loadDraftInputs();
  delete drafts[key];
  await chrome.storage.local.set({ [DRAFT_INPUTS_KEY]: drafts });
}

// Pending requests - survives popup close
export async function loadPendingRequests() {
  const result = await chrome.storage.local.get([PENDING_REQUESTS_KEY]);
  return result[PENDING_REQUESTS_KEY] || {};
}

export async function savePendingRequest(id, data) {
  const pending = await loadPendingRequests();
  pending[id] = { ...data, startedAt: Date.now() };
  await chrome.storage.local.set({ [PENDING_REQUESTS_KEY]: pending });
}

export async function clearPendingRequest(id) {
  const pending = await loadPendingRequests();
  delete pending[id];
  await chrome.storage.local.set({ [PENDING_REQUESTS_KEY]: pending });
}
