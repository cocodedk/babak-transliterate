# Babak Transliterate

A Chrome Manifest V3 extension that uses AI to transliterate Latin text to Persian (Farsi) and generate creative ASCII art. Built with modern web technologies and a dark-mode UI.

## Website
- [English](https://transliterate.cocode.dk/)
- [فارسی (Persian)](https://transliterate.cocode.dk/fa/)

## Features
- **Transliteration**: Select any Latin text on any webpage, right-click, and convert to Persian instantly
- **ASCII Art Chat**: Generate creative ASCII art through an AI-powered chat interface
- **Secure Storage**: API credentials stored with Chrome sync storage
- **Dark UI**: Dark mode by default, glassmorphism design, smooth animations
- **Fast & Lightweight**: Optimized for performance with lazy loading and debounced inputs

## Download
[**Download Babak Transliterate**](https://github.com/cocodedk/babak-transliterate/releases/latest)

## Build from Source
**Prerequisites:** Node.js 18 or later, Google Chrome.

```bash
git clone https://github.com/cocodedk/babak-transliterate.git
cd babak-transliterate
npm test
./scripts/install-hooks.sh
```

Load extension: `chrome://extensions/` → Developer mode → Load unpacked → select `src/`

## Architecture

```
babak-transliterate/
├── src/               ← Extension source (load this in Chrome)
│   ├── manifest.json  ← Chrome MV3 manifest
│   ├── background/    ← Service worker, AI API calls
│   ├── content/       ← Content scripts
│   ├── popup/         ← Toolbar popup
│   ├── options/       ← Settings page (API key)
│   └── shared/        ← Transliteration engine
├── tests/             ← Node.js built-in test runner tests
└── website/           ← GitHub Pages site
```

| Component | Technology |
|-----------|-----------|
| Extension runtime | Chrome MV3 |
| Language | JavaScript (ES modules) |
| Tests | Node.js built-in test runner |
| Build | None required |

## Author

**Babak Bandpey** — [cocode.dk](https://cocode.dk) | [LinkedIn](https://linkedin.com/in/babakbandpey) | [GitHub](https://github.com/cocodedk)

## License

Apache-2.0 | © 2026 [Cocode](https://cocode.dk) | Created by [Babak Bandpey](https://linkedin.com/in/babakbandpey)
