# Contributing to WhoAte

Thank you for your interest in contributing to WhoAte! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all backgrounds and experience levels.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/whoate.git
   cd whoate
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Add your OpenAI API key to `.env.local`
3. Start the development server:
   ```bash
   npm run dev
   ```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

- Run linter: `npm run lint`
- Auto-fix issues: `npm run lint:fix`
- Format code: `npm run format`

Please ensure your code passes linting before submitting a PR.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add multi-receipt support
fix: correct tax calculation for shared items
docs: update API documentation
```

## Pull Request Process

1. Ensure your code passes all checks:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

2. Update documentation if needed

3. Create a Pull Request with:
   - Clear title describing the change
   - Description of what was changed and why
   - Link to related issue (if applicable)

4. Wait for review - maintainers will review your PR and may request changes

## Reporting Bugs

Please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/OS information

## Suggesting Features

Open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Possible implementation approach (optional)

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping make WhoAte better!
