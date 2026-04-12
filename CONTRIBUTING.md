# Contributing to Babak Transliterate

## Local Setup
1. Install Node.js 18 or later.
2. Clone the repository.
3. Run `npm test` to verify the test suite passes.
4. Load the extension from `src/` via `chrome://extensions/` → **Load unpacked**.

## Install Git Hooks
```sh
./scripts/install-hooks.sh
```

## Build and Test Commands
```bash
npm test        # Run Node.js built-in tests
# Load extension: chrome://extensions/ → Developer mode → Load unpacked → select src/
```

## Local Git Setup
Run these once after cloning:
```bash
git config pull.rebase true
git config core.autocrlf input
git config push.autoSetupRemote true
git config init.defaultBranch main
```

## Coding Style
- ES modules (`type: "module"` in package.json).
- Keep JavaScript files under 200 lines — extract helpers when approaching the limit.
- All AI API calls go through the background service worker only.
- No hardcoded API keys — always use Chrome sync storage.

## Branch Naming
| Prefix | Type | Example |
|--------|------|---------|
| `feature/` | `feat:` | `feature/add-arabic-support` |
| `fix/` | `fix:` | `fix/context-menu-not-showing` |
| `chore/` | `chore:` | `chore/update-dependencies` |
| `docs/` | `docs:` | `docs/update-contributing` |
| `refactor/` | `refactor:` | `refactor/extract-ai-client` |
| `ci/` | `ci:` | `ci/add-dependabot` |

## PR Checklist
- [ ] `npm test` passes.
- [ ] Manual test completed in Chrome with the extension loaded unpacked.
- [ ] Updated docs if behavior changed.
- [ ] Commit message follows Conventional Commits (`feat: ...`, `fix: ...`, etc.).
