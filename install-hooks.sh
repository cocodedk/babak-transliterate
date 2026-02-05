#!/bin/sh
# Install script for git hooks

echo "Installing pre-commit hook..."
cp .git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Pre-commit hook installed successfully."
