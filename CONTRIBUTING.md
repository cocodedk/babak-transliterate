# Contributing to Babak's AI Transliterator

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Submitting Changes](#submitting-changes)
- [Questions?](#questions)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Git
- Google Chrome (for testing)

### Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/babak-transliterate.git
   cd babak-transliterate
   ```

3. **Install git hooks** (required):
   ```bash
   ./install-hooks.sh
   ```
   This installs a pre-commit hook that automatically runs tests before each commit.

4. **Verify setup**:
   ```bash
   npm test
   ```
   All tests should pass before you start developing.

## Development Workflow

### Creating a Feature

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Use prefixes: `feature/`, `fix/`, `docs/`, `refactor/`, or `test/`

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm test
   ```
   The pre-commit hook will also run tests, but test manually first.

4. **Commit your changes** (see commit guidelines below)

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Coding Standards

### File Size (CRITICAL)

- **Target**: 150 lines maximum per file
- **Absolute Maximum**: 200 lines (only if absolutely necessary)
- **Applies to**: All source code AND test files
- **Philosophy**: Shorter files = better maintainability

**When a file exceeds limits:**
1. Split into smaller, focused modules
2. Extract reusable components
3. Create utility modules for shared logic
4. Separate concerns (UI, logic, data)

### Code Style

- **Indentation**: 2 spaces (no tabs)
- **Line endings**: LF (Unix-style)
- **Max line length**: 100 characters
- **Semicolons**: Required
- **Quotes**: Single quotes for strings, double quotes for HTML attributes

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (utilities) | `kebab-case.js` | `script-cipher.js` |
| Files (components) | `PascalCase.js` | `HistoryPanel.js` |
| Files (tests) | `*.test.js` | `api-client.test.js` |
| Variables/Functions | `camelCase` | `getApiKey` |
| Constants | `UPPER_SNAKE_CASE` | `API_TIMEOUT` |
| Classes | `PascalCase` | `ScriptCipher` |

### JavaScript Guidelines

- Use ES6+ features (arrow functions, destructuring, template literals)
- Use `const` by default, `let` when necessary, never `var`
- Use async/await for asynchronous code
- Handle errors gracefully with try/catch
- No console.log in production code (use only for debugging)
- Document functions with JSDoc comments for public APIs

### Chrome Extension Guidelines

- **Manifest V3**: Use service workers, not background pages
- **Permissions**: Request minimal permissions, explain why in PR
- **Storage**: Use `chrome.storage.local`, encrypt sensitive data
- **Content Scripts**: Minimize impact on page performance
- **Message Passing**: Use proper message passing between contexts

### UI/UX Requirements

- **Dark Mode**: Default to dark theme with light mode support
- **Modern Design**: Glassmorphism, rounded corners, subtle gradients
- **Animations**: CSS transitions, loading states, smooth interactions
- **Responsive**: Works at all sizes from mobile to desktop
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, ARIA labels

### Performance

- Lazy load non-critical components
- Debounce input handlers (300ms default)
- Optimize API calls with caching where appropriate
- Minimize bundle size - no unnecessary dependencies

## Commit Guidelines

### Conventional Commits Format

Use the format: `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**
```
feat(popup): add copy-to-clipboard button
fix(api): handle timeout errors gracefully
docs(readme): update installation instructions
refactor(cipher): extract encryption logic into smaller functions
test(api-client): add error handling tests
```

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Don't capitalize first letter
- No period at the end
- Keep subject under 50 characters
- Reference issue numbers when applicable: `fixes #123`

### Pre-commit Hook

Tests run automatically before each commit. If tests fail, the commit is aborted.

```bash
# To bypass (not recommended for production):
git commit --no-verify -m "your message"
```

## Submitting Changes

### Pull Request Process

1. **Update README.md** if your change affects usage or setup
2. **Update documentation** in `/docs` if architecture changes
3. **Add tests** for new functionality
4. **Ensure all tests pass**: `npm test`
5. **Verify file sizes**: All files under 200 lines
6. **Fill out the PR template** (if available)
7. **Link related issues**: Include "Fixes #123" or "Closes #456"

### PR Review Checklist

Before requesting review:

- [ ] Code follows style guidelines
- [ ] All files under 200 lines (preferably 150)
- [ ] Tests added/updated and passing
- [ ] No hardcoded secrets or credentials
- [ ] Error handling implemented
- [ ] UI is responsive and accessible
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions

### Review Process

- Maintainers will review PRs within 48 hours
- Address review comments promptly
- Be open to feedback and suggestions
- Squash commits if requested
- Once approved, a maintainer will merge

## Project Structure

```
.
├── docs/
│   └── AGENTS.md          # Detailed development guidelines
├── src/
│   ├── background/        # Service worker
│   ├── content/           # Content scripts
│   ├── options/           # Settings page
│   ├── popup/             # Extension popup
│   ├── shared/            # Shared utilities
│   └── icons/             # Extension icons
├── tests/                 # Test files
├── .git-hooks/            # Shared git hooks
├── install-hooks.sh       # Hook installation script
├── package.json           # Dependencies and scripts
└── README.md              # Main documentation
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/api-client.test.js
```

### Writing Tests

- All test files must end with `.test.js`
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies (API calls, browser APIs)
- Keep test files under 200 lines

### Test Coverage Areas

- **Unit tests**: Encryption/decryption, utility functions
- **Integration tests**: API client functionality
- **Error handling**: Network failures, invalid inputs
- **Edge cases**: Empty inputs, special characters, large inputs

## Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Create an issue with reproduction steps
- **Feature requests**: Create an issue with use case description
- **Security issues**: Email directly (see Security section in README)

## Recognition

Contributors will be:
- Listed in the README (after significant contributions)
- Mentioned in release notes
- Credited in commit history

Thank you for contributing! 🎉
