import { loadLastResults } from './popup-storage.js';

export async function restoreResults({ updateModeUI, setStatus }) {
  const last = await loadLastResults();
  const transliterate = last.transliterate;
  const ascii = last.ascii;

  if (transliterate?.output) {
    const input = document.getElementById('transliterate-input');
    const output = document.getElementById('transliterate-result');
    const area = document.getElementById('transliterate-result-area');
    const toggle = document.getElementById('translate-mode');
    if (input && transliterate.input) input.value = transliterate.input;
    if (toggle && typeof transliterate.isTranslate === 'boolean') {
      toggle.checked = transliterate.isTranslate;
      updateModeUI();
    }
    output.textContent = transliterate.output;
    area.classList.remove('hidden');
    area.setAttribute('aria-busy', 'false');
    setStatus('transliterate-status', '', false);
  }

  if (ascii?.output) {
    const input = document.getElementById('ascii-input');
    const output = document.getElementById('ascii-result');
    const area = document.getElementById('result-area');
    if (input && ascii.input) input.value = ascii.input;
    output.textContent = ascii.output;
    area.classList.remove('hidden');
    area.setAttribute('aria-busy', 'false');
    setStatus('ascii-status', '', false);
  }
}
