# Contributing to OSPO Events Manager

Thank you for your interest in contributing to the OSPO Events Manager! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Continuous Integration](#continuous-integration)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project follows a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 13 or higher
- Keycloak instance (or use the provided configuration)
- Git

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/OSPOEventsManager.git
   cd OSPOEventsManager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp env.template .env
   # Edit .env with your configuration
   ```

4. **Set Up Database**
   ```bash
   # Start PostgreSQL
   # Update .env with database credentials
   npm run db:push
   ```

5. **Run the Application**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   ```bash
   npm run check  # Type check
   npm test       # Run tests
   ```

## Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes**
   - Write code following our [coding standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run check          # TypeScript type check
   npm test               # Run all tests
   npm run test:coverage  # Check coverage
   npm run build          # Ensure build works
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## Testing

We maintain a comprehensive test suite with **899 tests** and **100% pass rate**.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests for specific module
npm test -- client/__tests__/components
```

### Writing Tests

- **Location**: Place tests in `__tests__` directories next to the code
- **Naming**: Use `.test.ts` or `.test.tsx` extension
- **Framework**: We use Vitest with React Testing Library
- **Coverage**: Aim for 80%+ coverage for new code

**Test Structure:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Test Categories

- **Shared Module** (143 tests): Database schemas, types, validation
- **Server Module** (309 tests): API logic, database operations, services
- **Client Module** (552 tests): Components, pages, hooks, utilities

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

## Continuous Integration

Our CI pipeline automatically runs on all pull requests and pushes.

### What Gets Tested

1. **TypeScript Type Check** - Ensures type safety
2. **Test Suite** - Runs all 899 tests
3. **Build Verification** - Ensures the app builds successfully
4. **Security Scan** - Checks for vulnerabilities

### CI Status Checks

Your PR must pass all CI checks before merging:

- ✅ **Lint & Type Check** - No TypeScript errors
- ✅ **Test Suite** - All 899 tests passing
- ✅ **Build** - Application builds successfully
- ⚠️ **Security Scan** - No high-severity vulnerabilities (advisory)

### Viewing CI Results

1. Go to your Pull Request on GitHub
2. Scroll to the "Checks" section at the bottom
3. Click "Details" next to any check to view logs
4. The CI bot will post a comment with test results

### Running CI Checks Locally

Before pushing, run these commands to catch issues early:

```bash
npm run check        # Type check (runs in CI)
npm test -- --run    # All tests (runs in CI)
npm run build        # Build check (runs in CI)
npm audit            # Security check (runs in CI)
```

## Pull Request Process

### Before Creating a PR

- [ ] All tests pass locally
- [ ] TypeScript type check passes
- [ ] Code follows our coding standards
- [ ] New tests added for new functionality
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (for significant changes)

### PR Template

When creating a PR, include:

**Description**
- What does this PR do?
- Why is this change needed?

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Tested manually

**Screenshots** (if applicable)

### Review Process

1. CI checks must pass (automated)
2. At least one maintainer approval required
3. Address review comments
4. Maintainer will merge when approved

### After Your PR is Merged

- Delete your feature branch
- Pull the latest main branch
- Start work on your next contribution!

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` type - use proper types
- Export types for reusable interfaces

### React Components

```typescript
// Use functional components with TypeScript
interface Props {
  name: string;
  onSubmit: (data: FormData) => void;
}

export function MyComponent({ name, onSubmit }: Props) {
  // Component logic
  return <div>{name}</div>;
}
```

### File Organization

```
client/src/
  ├── components/     # Reusable UI components
  ├── pages/          # Page-level components
  ├── hooks/          # Custom React hooks
  ├── lib/            # Utility functions
  └── contexts/       # React contexts

server/
  ├── services/       # Business logic
  ├── __tests__/      # Server tests
  └── index.ts        # Server entry

shared/
  ├── database-schema.ts  # Database tables
  ├── database-types.ts   # Zod schemas
  └── schema.ts           # Exports
```

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use trailing commas
- Run linter before committing

```bash
npm run check  # Will catch most style issues
```

### Naming Conventions

- **Files**: kebab-case (`my-component.tsx`)
- **Components**: PascalCase (`MyComponent`)
- **Functions**: camelCase (`handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Interfaces**: PascalCase with `I` prefix optional (`IUser` or `User`)

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(events): add CSV import functionality

Implements bulk event import from CSV files with deduplication
based on name and date.

Closes #123
```

```bash
fix(auth): resolve token refresh issue

Token was not being refreshed before expiry, causing
unexpected logouts. Now refreshes 5 minutes before expiry.

Fixes #456
```

```bash
test(components): add tests for theme toggle

Adds comprehensive unit tests for theme toggle component
including light, dark, and system theme switching.
```

## Documentation

When adding features or making changes:

1. **Code Comments**: Add JSDoc comments for complex functions
2. **README**: Update if adding new features
3. **CHANGELOG**: Add entry for user-facing changes
4. **API Docs**: Update if changing API endpoints
5. **User Docs**: Update docs/ if changing user features

## Getting Help

- **Documentation**: Check [docs/](./docs/) directory
- **Testing Guide**: See [TESTING.md](./TESTING.md)
- **Architecture**: See [docs/developer/architecture.md](./docs/developer/architecture.md)
- **Issues**: Check [GitHub Issues](https://github.com/YOUR_USERNAME/OSPOEventsManager/issues)
- **Discussions**: Use GitHub Discussions for questions

## Issue Templates

Use the appropriate issue template when creating issues:

- 🐛 **Bug Report**: For reporting bugs
- ✨ **Feature Request**: For suggesting new features
- 📚 **Documentation**: For documentation improvements
- 🔒 **Security**: For security vulnerabilities (use security advisory)
- ❓ **Question**: For general questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Recognition

Contributors will be recognized in:
- Project README (Contributors section)
- Release notes for significant contributions
- GitHub contributors page

---

**Thank you for contributing to OSPO Events Manager!** 🎉

If you have questions or need help, don't hesitate to ask in issues or discussions.

