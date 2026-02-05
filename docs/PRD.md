# Product Requirements Document (PRD)

## Chrome Extension: AI Transliterator & ASCII Art Assistant

### Overview
A Chrome extension that leverages AI to transliterate Latin text to non-Latin scripts (starting with Persian) and generate ASCII art through an interactive chat interface.

---

## Core Features

### 1. AI-Powered Transliteration
- **Text Selection**: Users select Latin text on any webpage
- **Context Menu**: Right-click to access "Transliterate to [Language]"
- **Language Selection**: Popup to choose target language (Persian initially)
- **AI Conversion**: Sends text to configured LLM API for transliteration
- **Output Options**: Replace text inline, show in popup, or copy to clipboard

### 2. ASCII Art Chat
- **Interactive Chat**: Popup interface with chat history
- **Art Generation**: User requests ASCII art, LLM returns formatted output
- **Copy Function**: One-click copy of generated art
- **History**: Recent conversations saved locally

### 3. Secure Configuration
- **API Settings**: Configure custom API URL and API Key
- **Encryption**: Proprietary "ScriptCipher" algorithm
  - Uses XOR + custom rotation cipher
  - Encryption key stored in browser storage
  - Both API URL and Key encrypted at rest
- **Settings Panel**: Accessible via extension popup or chrome://extensions

---

## User Flow

### Transliteration Flow
1. User selects Latin text on webpage
2. Right-click → "Transliterate..."
3. Choose target language from dropdown
4. Extension sends to LLM with prompt template
5. AI returns transliterated text
6. Display result (replace/overlay/copy)

### ASCII Art Flow
1. Click extension icon
2. Switch to "ASCII Art" tab
3. Type request (e.g., "cat playing piano")
4. AI generates ASCII art
5. Display with copy button

---

## Technical Requirements

### Architecture
- **Manifest**: V3
- **Storage**: chrome.storage.local for encrypted credentials
- **Permissions**: 
  - storage
  - contextMenus
  - activeTab
  - scripting (for text replacement)
- **Host Permissions**: User-configured API endpoint

### Security: ScriptCipher Encryption
```
Encryption Method:
1. Generate 32-byte key from master key + salt
2. XOR plaintext with rotating key pattern
3. Apply custom byte substitution (S-box)
4. Base64 encode result
```

### UI/UX Design
- **Modern Design**: Glassmorphism cards, rounded corners
- **Dark Mode**: Default with light mode toggle
- **Animations**: Smooth transitions, loading states
- **Responsive**: Works on all screen sizes
- **Accessibility**: WCAG 2.1 AA compliance

---

## File Structure

```
chrome-extension/
├── manifest.json              # Extension manifest
├── background.js              # Service worker (context menus)
├── content.js                 # Page script (text selection)
├── popup/
│   ├── popup.html            # Main popup interface
│   ├── popup.js              # Popup logic
│   └── popup.css             # Styles
├── options/
│   ├── options.html          # Settings page
│   ├── options.js            # Settings logic
│   └── options.css           # Settings styles
├── shared/
│   ├── script-cipher.js      # Encryption/decryption
│   ├── api-client.js         # LLM API communication
│   └── constants.js          # App constants
└── icons/                    # Extension icons
```

---

## Prompts

### Transliteration Prompt
```
You are a transliteration expert. Convert the following Latin text to {language}.
Maintain the phonetic pronunciation as closely as possible.
Only return the transliterated text, no explanations.

Text: {selected_text}
```

### ASCII Art Prompt
```
Create ASCII art of: {user_request}
Use only standard ASCII characters.
Ensure the art is creative and well-formatted.
```

---

## Success Metrics

- Transliteration accuracy > 95%
- Response time < 3 seconds
- Zero plaintext credential exposure
- Clean, intuitive UI with < 2 clicks per action

---

## Future Enhancements

- Additional languages: Arabic, Urdu, Hebrew, Cyrillic
- Batch transliteration
- Custom prompt templates
- Export chat history
- Keyboard shortcuts

---

## Version 1.0 Scope

- Persian transliteration only
- Single API provider support
- Basic ASCII art generation
- Secure credential storage
- Beautiful, responsive UI
