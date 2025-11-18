# Contributing to Heinicus Mobile Mechanic App

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Security](#security)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Pull Requests](#pull-requests)

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- React Native development environment
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd rork-heinicus-mobile-mechanic-app

# Install dependencies
npm install

# Start the development server
npm start
```

## Security

### HEI-130: Secret Detection with Gitleaks

This project uses **Gitleaks** to prevent accidental commits of sensitive information like passwords, API keys, and tokens.

#### What is Gitleaks?
Gitleaks is a fast, light-weight, portable SAST (Static Application Security Testing) tool for detecting hardcoded secrets like passwords, api keys, and tokens in git repos.

#### Installation

Gitleaks is already installed in this project at `.git-tools/gitleaks`. The pre-commit hook will automatically run when you make commits.

If you need to reinstall or update gitleaks:

```bash
# Create tools directory
mkdir -p .git-tools

# Download gitleaks (Linux x64)
cd .git-tools
curl -L https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz -o gitleaks.tar.gz
tar -xzf gitleaks.tar.gz
chmod +x gitleaks
cd ..

# For macOS
# curl -L https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_darwin_arm64.tar.gz -o gitleaks.tar.gz

# For Windows
# Download from: https://github.com/gitleaks/gitleaks/releases
```

#### Pre-commit Hook

A pre-commit hook is automatically installed at `.git/hooks/pre-commit`. It will:
1. Scan staged files for secrets before each commit
2. Block commits if secrets are detected
3. Provide instructions for handling false positives

#### Manual Scanning

You can manually scan your codebase at any time:

```bash
# Scan all files
.git-tools/gitleaks detect --verbose --config=.gitleaks.toml

# Scan only staged changes
.git-tools/gitleaks protect --staged --config=.gitleaks.toml

# Generate a report
.git-tools/gitleaks detect --report-path=gitleaks-report.json --config=.gitleaks.toml
```

#### Configuration

Gitleaks configuration is stored in `.gitleaks.toml`. This file contains:

1. **Custom rules** - Project-specific secret patterns:
   - Generic passwords
   - Email addresses (matthew.heinen.*)
   - Secret keywords
   - Firebase API keys
   - AWS credentials
   - Private keys
   - JWT tokens
   - Database URLs

2. **Allowlist** - Known false positives:
   - Test/mock credentials (e.g., `DevAdminPass123!@`)
   - Development email addresses (e.g., `admin@dev.local`)
   - Documentation files (*.md)
   - Dependencies (node_modules/, etc.)

#### Handling False Positives

If Gitleaks flags something that isn't actually a secret:

1. **Review carefully** - Make sure it's actually a false positive
2. **Update `.gitleaks.toml`** - Add the pattern to the allowlist:
   ```toml
   [allowlist]
   regexes = [
     '''your-safe-pattern-here''',
   ]
   ```
3. **Commit the updated config** first
4. **Then commit your changes**

#### Bypass Pre-commit Hook (Not Recommended)

In rare cases where you must bypass the check:
```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning**: Only use `--no-verify` if you're absolutely certain no secrets are being committed.

#### What to Do If You Committed a Secret

If you accidentally commit a secret:

1. **DO NOT** just remove it in a new commit (it's still in git history)
2. **Immediately rotate the credential** on the affected service
3. **Remove from git history** using:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
   Or use BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
4. **Force push** (after coordinating with team):
   ```bash
   git push origin --force --all
   ```
5. **Notify team members** to rebase their branches
6. **File security incident** following SECURITY.md guidelines

## Development Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `security/issue-name` - Security fixes
- `docs/topic` - Documentation updates

### Commit Messages
Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `security`: Security fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(auth): add JWT authentication middleware
fix(api): prevent SQL injection in user queries
security(creds): rotate compromised credentials
docs(contributing): add gitleaks setup instructions
```

### Development Credentials

**NEVER** use production credentials in development. This project uses clearly marked development credentials:

```typescript
// Development only - not real credentials
admin@dev.local / DevAdminPass123!@
mechanic@dev.local / DevMechanicPass123!@
customer@dev.local / DevCustomerPass123!@
```

## Code Quality

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

### Formatting
```bash
npm run format
```

## Testing

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

## Pull Requests

### Before Submitting
- [ ] All tests pass
- [ ] No linting errors
- [ ] No security issues (gitleaks scan passes)
- [ ] Code is properly formatted
- [ ] Documentation is updated
- [ ] Commit messages follow conventions

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Security fix
- [ ] Documentation update

## Testing
Describe how you tested these changes

## Checklist
- [ ] Tests pass
- [ ] Gitleaks scan passes
- [ ] Documentation updated
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Enable 2FA** on all accounts
3. **Use unique passwords** for each service
4. **Rotate credentials** if compromised
5. **Review security logs** regularly
6. **Keep dependencies updated**
7. **Follow principle of least privilege**

## Questions or Issues?

- Create an issue in the repository
- Contact the maintainers
- Review existing documentation in `SECURITY.md`

---

Thank you for contributing to Heinicus Mobile Mechanic App!
