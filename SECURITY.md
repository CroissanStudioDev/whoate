# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report vulnerabilities via one of these methods:

1. **Email**: Send details to [serge@croissanstudio.ru](mailto:serge@croissanstudio.ru)
2. **GitHub Security Advisories**: Use the [Security tab](https://github.com/CroissanStudioDev/whoate/security/advisories/new) to report privately

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity, typically 30-90 days

### Scope

The following are in scope:
- WhoAte web application
- API endpoints
- Authentication/session handling
- Data storage and privacy

Out of scope:
- Third-party dependencies (report to their maintainers)
- Social engineering attacks
- Physical attacks

## Security Best Practices for Users

- Never commit your `.env` file or API keys
- Use Redis with authentication in production
- Deploy behind HTTPS
- Keep dependencies updated

## Acknowledgments

We appreciate security researchers who help keep WhoAte secure. Contributors who report valid vulnerabilities will be acknowledged here (with permission).
