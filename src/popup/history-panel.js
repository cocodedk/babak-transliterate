import { loadHistory, saveHistoryEntry, deleteHistoryEntry, clearHistory } from './popup-storage.js';

class HistoryPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.bindDeleteHandler();
  }

  async refresh() {
    const history = await loadHistory();
    this.render(history);
  }

  async record(request, art) {
    await saveHistoryEntry(request, art);
    await this.refresh();
  }

  bindClearButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    this.clearButton = button;
    button.addEventListener('click', async () => {
      if (!confirm('Clear all history?')) return;
      button.disabled = true;
      await clearHistory();
      await this.refresh();
      button.disabled = false;
    });
  }

  bindDeleteHandler() {
    if (!this.container) return;
    this.container.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action="delete-history"]');
      if (!button) return;
      const timestamp = Number(button.dataset.timestamp);
      if (!Number.isFinite(timestamp)) return;
      if (!confirm('Delete this history item?')) return;
      await deleteHistoryEntry(timestamp);
      await this.refresh();
    });
  }

  render(history) {
    if (!this.container) return;
    if (this.clearButton) {
      this.clearButton.disabled = history.length === 0;
    }
    if (history.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">💬</span>
          <p>No conversations yet</p>
          <p class="empty-sub">Start chatting to see history</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = history.map(item => `
      <div class="chat-item">
        <div class="chat-item-header">
          <span class="chat-item-request">${this.escapeHtml(item.request)}</span>
          <div class="chat-item-actions">
            <span class="chat-item-time">${this.formatTime(item.timestamp)}</span>
            <button class="icon-btn small" data-action="delete-history" data-timestamp="${item.timestamp}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="chat-item-preview">${this.escapeHtml(item.output ?? item.art ?? '')}</div>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export default HistoryPanel;
