# AGENTS.md - Development Guidelines

## File Size Rules (CRITICAL)

### Maximum Line Limits
- **Target**: 150 lines maximum per file
- **Absolute Maximum**: 200 lines (only if absolutely necessary)
- **Applies to**: All source code AND test files
- **Philosophy**: Shorter files = better maintainability

### When Files Exceed Limits
1. Split into smaller, focused modules
2. Extract reusable components
3. Create utility modules for shared logic
4. Separate concerns (UI, logic, data)

---

## Code Quality Standards

### UI/UX Requirements
- **Modern Design**: Implement glassmorphism, rounded corners, gradients
- **Dark Mode First**: Default dark theme with light mode toggle
- **Smooth Animations**: CSS transitions, loading states, micro-interactions
- **Responsive**: Mobile-first design, works at all sizes
- **Accessibility**: WCAG 2.1 AA, keyboard navigation, ARIA labels

### Performance
- Lazy load non-critical components
- Debounce input handlers (300ms)
- Optimize API calls with caching
- Minimize bundle size

---

## Architecture Patterns

### Chrome Extension Structure
```
src/
├── manifest.json          # Extension config
├── background/            # Service worker
├── content/               # Page scripts
├── popup/                 # Extension popup
├── options/               # Settings page
├── shared/                # Shared utilities
│   ├── script-cipher.js   # Encryption/decryption
│   ├── api-client.js      # LLM API communication
│   └── constants.js       # App constants & prompts
└── __tests__/             # Test files (also max 150 lines)
```

### Module Organization
- One component per file
- One utility function group per file
- Separate styles from logic
- Test file mirrors source structure

---

## Security Guidelines

### Encryption (ScriptCipher)
- **API Key only**: Encrypt API key at rest, other settings stored as plaintext
- Use browser storage API (chrome.storage.local)
- Simple XOR cipher with user-provided passphrase
- Decrypt on-demand when making API calls

### API Communication
- Validate API responses
- Handle errors gracefully
- Never log sensitive data (API keys, passphrases)
- Use HTTPS only

---

## Naming Conventions

### Files
- `kebab-case.js` for utilities
- `PascalCase.js` for components
- `*.test.js` for tests
- `*.css` for styles

### Variables
- `camelCase` for variables/functions
- `UPPER_SNAKE_CASE` for constants
- `PascalCase` for classes/components

---

## Testing Requirements

### Coverage
- Unit tests for encryption/decryption
- Integration tests for API calls
- UI component tests
- Error handling tests

### Test Structure
```javascript
// Max 150 lines per test file
describe('Feature', () => {
  beforeEach(() => { /* setup */ });
  
  it('should do something', () => {
    // test
  });
});
```

---

## Git Workflow

### Pre-commit Hook
Tests run automatically before each commit. To install:
```bash
./install-hooks.sh
```

### Commits
- Conventional commits format
- Small, atomic commits
- Reference issue numbers

### Branches
- `main`: Production-ready
- `feature/*`: New features
- `fix/*`: Bug fixes

---

## Extension-Specific Rules

### Manifest V3
- Use service workers (not background pages)
- Avoid DOM manipulation in background
- Use message passing for communication

### Permissions
- Request minimal permissions
- Explain why each is needed
- Handle permission denials gracefully

### Storage
- Encrypt API key before storing (other settings plaintext)
- Use structured data format
- Implement migration strategies

---

## Review Checklist

Before submitting:
- [ ] File under 150 lines (max 200)
- [ ] No hardcoded secrets
- [ ] Error handling implemented
- [ ] Tests passing
- [ ] UI polished and responsive
- [ ] Accessibility verified
- [ ] Documentation updated
