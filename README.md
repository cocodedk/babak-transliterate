# Babak's AI Transliterator & ASCII Art

[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Available-brightgreen)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D%2018-brightgreen)](https://nodejs.org/)

A beautiful Chrome extension that uses AI to transliterate Latin text to Persian (Farsi) and generate creative ASCII art. Built with modern web technologies and a stunning dark-mode UI.

## ✨ Features

- **📝 Transliteration**: Select any Latin text on any webpage, right-click, and convert to Persian instantly
- **🎨 ASCII Art Chat**: Generate creative ASCII art through an AI-powered chat interface
- **🔒 Secure Storage**: API credentials encrypted with proprietary "ScriptCipher" algorithm
- **🌙 Modern UI**: Dark mode by default, glassmorphism design, smooth animations, responsive layout
- **⚡ Fast & Lightweight**: Optimized for performance with lazy loading and debounced inputs

## 📋 Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Development](#development)
- [Architecture](#architecture)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

### Prerequisites

- Google Chrome (or Chromium-based browser)
- Node.js 18+ (for development)
- An API key from an LLM provider (OpenAI, OpenRouter, etc.)

### Method 1: Load Unpacked Extension (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/cocodedk/babak-transliterate.git
   cd babak-transliterate
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/` in your browser
   - Or click the menu → More tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the extension**
   - Click the "Load unpacked" button
   - Select the `src` folder from the cloned repository
   - The extension icon should appear in your toolbar

### Method 2: Chrome Web Store (Coming Soon)

Once published, you can install directly from the Chrome Web Store.

## ⚙️ Setup

### Initial Configuration

1. **Open the extension popup**
   - Click the extension icon in your Chrome toolbar

2. **Access Settings**
   - Click the ⚙️ (settings) button in the popup
   - This opens the settings/options page

3. **Configure API Credentials**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **API URL** | Your LLM endpoint | `https://api.openai.com/v1/chat/completions` |
   | **API Key** | Your API key from the provider | `sk-...` or `sk-or-v1-...` |
   | **Encryption Passphrase** | Secure passphrase for credential encryption | Create a strong, memorable passphrase |

   **Supported API Providers:**
   - OpenAI (`https://api.openai.com/v1/chat/completions`)
   - OpenRouter (`https://openrouter.ai/api/v1/chat/completions`)
   - Any OpenAI-compatible API endpoint

4. **Save and Test**
   - Click "Save Settings" to store your credentials (encrypted)
   - Click "Test Connection" to verify everything works
   - You should see a success message if the connection is valid

### Security Note

Your API key is encrypted at rest using the ScriptCipher algorithm with your passphrase. The passphrase is never stored - you'll need to enter it each time you want to decrypt the API key for API calls.

## 🎯 Usage

### Transliteration

Convert Latin text to Persian (Farsi) on any webpage:

1. **Select text** on any webpage
2. **Right-click** to open the context menu
3. **Click "Transliterate to Persian"**
4. **View the result** in the overlay popup that appears
5. **Copy or Replace**:
   - Click "Copy" to copy the Persian text to clipboard
   - Click "Replace" to replace the selected text on the page
   - Click outside or press Escape to close

**Example:**
- Input: `salam`
- Output: `سلام`

### ASCII Art Generator

Generate creative ASCII art through the chat interface:

1. **Click the extension icon** in your toolbar
2. **Type your request** in the chat input (e.g., "a cat playing piano", "mountain landscape at sunset")
3. **Click "Generate Art"** or press Enter
4. **Wait for the AI** to generate your ASCII art
5. **View and copy** the generated art
6. **View history** - all your previous generations are saved in the panel below

**Example Requests:**
- "a dragon breathing fire"
- "sunset over ocean waves"
- "coffee cup with steam"

### Keyboard Shortcuts

- **ESC**: Close any overlay or popup
- **Enter**: Submit chat message (in ASCII art chat)

## 🛠️ Development

### Setup Development Environment

1. **Clone the repo**
   ```bash
   git clone https://github.com/cocodedk/babak-transliterate.git
   cd babak-transliterate
   ```

2. **Install git hooks** (optional but recommended)
   ```bash
   ./install-hooks.sh
   ```
   This installs a pre-commit hook that runs tests before each commit.

3. **Run tests**
   ```bash
   npm test
   ```

### Project Structure

```
src/
├── manifest.json              # Extension manifest
├── background/                # Service worker
│   └── background.js          # Context menu handling
├── content/                   # Content scripts
│   ├── content.js             # Text selection & overlay
│   └── content.css            # Overlay styles
├── popup/                     # Extension popup
│   ├── popup.html             # Popup HTML
│   ├── popup.js               # Popup logic
│   ├── popup-storage.js       # History management
│   ├── history-panel.js       # History UI component
│   ├── restore-results.js     # Results restoration
│   ├── popup-base.css         # Base styles
│   └── popup-components.css   # Component styles
├── options/                   # Settings page
│   ├── options.html           # Options HTML
│   ├── options.js             # Options logic
│   ├── options-base.css       # Base styles
│   └── options-components.css # Component styles
├── shared/                    # Shared utilities
│   ├── script-cipher.js       # Encryption/decryption
│   ├── api-client.js          # LLM API client
│   └── constants.js           # App constants & prompts
└── icons/                     # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Running Tests

Tests are written using Node.js's built-in test runner:

```bash
# Run all tests
npm test

# Tests include:
# - Encryption/decryption roundtrips
# - API client functionality
# - Connection testing
```

### Building for Production

No build step is required! This is a vanilla JavaScript extension. Just load the `src` folder as an unpacked extension.

## 🏗️ Architecture

### Key Design Principles

- **File Size Limits**: All source files are under 150 lines (max 200) for maintainability
- **Modular Structure**: Each file has a single responsibility
- **Security First**: API keys are encrypted at rest
- **Modern UI**: Glassmorphism, dark mode, smooth animations
- **Performance**: Lazy loading, debounced inputs, optimized API calls

### Chrome Extension Architecture

This extension uses Manifest V3:

- **Service Worker** (`background/`): Handles context menus and message passing
- **Content Scripts** (`content/`): Runs on web pages, manages text selection and overlays
- **Popup** (`popup/`): Extension popup UI for ASCII art generation
- **Options Page** (`options/`): Settings and configuration

### Encryption (ScriptCipher)

The ScriptCipher algorithm provides:
- XOR encryption with rotating key
- Random salt for each encryption
- S-box byte substitution
- Nonce-based authentication

API keys are encrypted before storage and decrypted on-demand when making API calls.

## 🔒 Security

### Credential Protection

- **Encryption at Rest**: API keys are encrypted using ScriptCipher before storage
- **Browser Storage**: Uses `chrome.storage.local` (encrypted by Chrome's storage encryption)
- **No Logging**: API keys and passphrases are never logged to console or sent to analytics
- **HTTPS Only**: All API calls use HTTPS

### Best Practices

- Choose a strong, unique passphrase
- Never share your passphrase
- Use environment-specific API keys (don't use production keys for testing)
- Regularly rotate your API keys

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Install hooks**: `./install-hooks.sh` (runs tests on commit)
4. **Make your changes** following the code style
5. **Ensure tests pass**: `npm test`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Style

- All files must be under 150 lines (max 200)
- Use meaningful variable names
- Follow existing code patterns
- Write tests for new functionality
- Keep functions small and focused

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love by Babak
- Icons designed for the Chrome Web Store
- Inspired by the need for better transliteration tools

---

**Questions or Issues?** Open an issue on GitHub: https://github.com/cocodedk/babak-transliterate/issues
