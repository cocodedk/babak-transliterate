# CLAUDE.md — Babak Transliterate

## Project Overview

Babak Transliterate is a Chrome Manifest V3 extension that uses AI to transliterate Latin text to Persian (Farsi) and generate ASCII art. It includes a Node.js-based transliteration engine tested with Node's built-in test runner.

- **Language / Runtime**: JavaScript (ES modules), Node.js 18+, Chrome Extension APIs (MV3)
- **Framework**: Vanilla JS, no build step required
- **Architecture**: Chrome Extension (background service worker + content scripts + popup + options UI) with a shared transliteration module
- **Package Manager**: npm (no lock file — private package)

---

## Required Skills — ALWAYS Invoke These

These skills **must** be invoked when the relevant situation arises. Never skip them.

| Situation | Skill |
|-----------|-------|
| Before any new feature or screen | `superpowers:brainstorming` |
| Planning multi-step changes | `superpowers:writing-plans` |
| Writing or fixing core logic | `superpowers:test-driven-development` |
| First sign of a bug or failure | `superpowers:systematic-debugging` |
| Before completing a feature branch | `superpowers:requesting-code-review` |
| Before claiming any task done | `superpowers:verification-before-completion` |
| Working on UI / frontend | `frontend-design:frontend-design` |
| After implementing — reviewing quality | `simplify` |

---

## Architecture

```
babak-transliterate/
├── src/                     ← Extension source (load this in Chrome)
│   ├── manifest.json        ← MV3 manifest
│   ├── background/          ← Service worker
│   ├── content/             ← Content scripts
│   ├── popup/               ← Toolbar popup UI
│   ├── options/             ← Extension options page
│   └── shared/              ← Shared utilities and transliteration engine
├── tests/                   ← Node.js built-in test runner tests
├── docs/                    ← Documentation
├── .githooks/               ← Pre-commit and commit-msg hooks
├── scripts/                 ← Repo management scripts
└── website/                 ← GitHub Pages site (English + Persian)
```

### Layer Rules
- `src/shared/` must be pure — no Chrome API calls
- Content scripts interact with page DOM — be defensive
- AI API calls only from background service worker

---

## Coding Conventions

- [ ] ES modules (`type: "module"` in package.json)
- [ ] All API keys stored via Chrome storage — never hardcoded
- [ ] 200-line maximum per file — extract helpers when approaching the limit
- [ ] Functions are pure where possible — no hidden side effects

---

## Engineering Principles

### File Size
- **200-line maximum per file** — extract a function or module when approaching the limit

### DRY · SOLID · KISS · YAGNI
- Extract shared logic into named utilities; never copy-paste
- Single Responsibility: one file does one thing
- Don't add features not yet needed
- Delete dead code immediately

### TDD
- Write the failing test first, make it pass, then refactor
- Test names describe behaviour: `"should transliterate 'sh' to 'ش'"`
- One assertion per test — keep tests focused and readable

### Commit hygiene
- Follow Conventional Commits: `feat: ...` / `fix: ...` / `chore: ...`
- The `commit-msg` hook enforces this automatically

---

## Build Commands

```bash
npm test        # Run Node.js built-in tests
# Load extension: chrome://extensions/ → Developer mode → Load unpacked → select src/
```

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — project conventions and session startup |
| `version.txt` | Semantic version (MAJOR.MINOR.PATCH) |
| `src/manifest.json` | Extension manifest — permissions, version, entry points |
| `src/shared/` | Shared transliteration engine and utilities |
| `.github/workflows/` | CI, release, and Pages automation |
| `.githooks/` | Pre-commit and commit-msg hooks |
| `scripts/install-hooks.sh` | One-time hook installer |

---

## Starting a New Session

1. Read this file
2. Run `npm test` to confirm all tests pass
3. Invoke `superpowers:brainstorming` before touching any feature
4. Follow the Required Skills table — every skill is mandatory, not optional
