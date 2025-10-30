# Testing Guide

This guide covers how to run and write tests for the OSPO Events Manager application.

## Overview

The project uses [Vitest](https://vitest.dev/) as the testing framework, providing fast test execution, excellent TypeScript support, and a modern testing experience.

## Running Tests

### Prerequisites

Ensure all dependencies are installed:

```bash
npm install
```

### Basic Test Commands

#### Run All Tests

```bash
npm test
```

This runs all tests once and displays results in the terminal.

#### Watch Mode

```bash
npm test -- --watch
```

Automatically re-runs tests when files change. Perfect for development.

#### Interactive UI

```bash
npm run test:ui
```

Opens an interactive web interface showing:
- Test results and status
- Code coverage
- Test execution time
- Detailed error messages
- File structure

#### Coverage Reports

```bash
npm run test:coverage
```

Generates coverage reports in multiple formats:
- **Terminal**: Summary displayed immediately
- **HTML**: Full report in `coverage/index.html`
- **JSON**: Machine-readable data in `coverage/coverage-final.json`

### Advanced Options

#### Run Specific Test File

```bash
npm test -- database-types.test.ts
```

#### Run Tests Matching a Pattern

```bash
npm test -- -t "Event Priorities"
```

#### Run Tests in a Directory

```bash
npm test -- shared/__tests__
```

#### Verbose Output

```bash
npm test -- --reporter=verbose
```

## Test Structure

### Current Test Coverage

#### Shared Module (`shared/__tests__/`)

Comprehensive unit tests for all database types, schemas, and validations:

- **`database-types.test.ts`** (60+ tests)
  - Enum validation (priorities, types, statuses, etc.)
  - Insert schema validation
  - Update schema validation
  - Edge case handling

- **`database-schema.test.ts`** (30+ tests)
  - Table structure verification
  - Column definitions
  - Naming conventions
  - Relationship integrity

- **`schema.test.ts`** (20+ tests)
  - Re-export verification
  - Legacy compatibility
  - Integration tests
  - Type inference

**Total: 100+ tests with 90%+ coverage**

### Test File Naming

Test files should be named with the `.test.ts` suffix:

```
shared/
  database-types.ts         # Source file
  __tests__/
    database-types.test.ts  # Test file
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = { value: 'test' };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing Validation Schemas

```typescript
import { insertEventSchema } from '@shared/database-types';

describe('insertEventSchema', () => {
  it('should validate valid event data', () => {
    const validEvent = {
      name: 'Test Conference',
      link: 'https://example.com',
      start_date: '2025-06-01',
      end_date: '2025-06-03',
      location: 'San Francisco',
      priority: 'high',
      type: 'conference',
    };

    const result = insertEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('should reject invalid event data', () => {
    const invalidEvent = { name: 'Test' };

    const result = insertEventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });
});
```

### Testing Async Code

```typescript
it('should fetch data successfully', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Testing Error Handling

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    dangerousFunction(null);
  }).toThrow('Invalid input');
});
```

## Best Practices

### 1. Write Descriptive Test Names

```typescript
// ✅ Good
it('should validate event with all required fields', () => { ... });

// ❌ Bad
it('test1', () => { ... });
```

### 2. Test One Thing Per Test

```typescript
// ✅ Good
it('should validate required username', () => {
  const result = schema.safeParse({});
  expect(result.success).toBe(false);
});

it('should accept valid username', () => {
  const result = schema.safeParse({ username: 'test' });
  expect(result.success).toBe(true);
});

// ❌ Bad
it('should validate username', () => {
  expect(schema.safeParse({})).toBe(false);
  expect(schema.safeParse({ username: 'test' })).toBe(true);
});
```

### 3. Keep Tests Independent

Each test should work in isolation:

```typescript
// ✅ Good
it('should create user', () => {
  const user = createUser({ username: 'test' });
  expect(user).toBeDefined();
});

// ❌ Bad - depends on previous test
let userId;
it('should create user', () => {
  userId = createUser({ username: 'test' }).id;
});
it('should find user', () => {
  const user = findUser(userId);
  expect(user).toBeDefined();
});
```

### 4. Use Clear Assertions

```typescript
// ✅ Good
expect(result.success).toBe(true);
expect(result.data.name).toBe('Test Event');

// ❌ Bad
expect(result).toBeTruthy();
```

## Coverage Goals

### Target Coverage

- **Overall Project**: 80%+
- **Shared Module**: 90%+
- **Server Routes**: 80%+
- **Server Utilities**: 85%+

### Viewing Coverage

After running `npm run test:coverage`, open `coverage/index.html` in your browser to see:

- Line coverage by file
- Branch coverage
- Function coverage
- Uncovered lines highlighted

## Continuous Integration

Tests should run automatically in CI/CD:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### Using VS Code

1. Add breakpoint in test file
2. Use VS Code's built-in debugger
3. Select "Debug Vitest Tests" configuration

### Using Browser DevTools

```bash
npm run test:ui
```

Then:
1. Click on any test
2. View detailed output
3. Inspect errors and stack traces

### Console Logging

```typescript
it('debug test', () => {
  console.log('Debug info:', data);
  expect(data).toBeDefined();
});
```

## Common Issues

### Test Timeout

If tests take too long:

```typescript
it('slow operation', async () => {
  await slowOperation();
}, 10000); // 10 second timeout
```

### Module Not Found

Check these:
1. Verify `vitest.config.ts` path aliases
2. Check file extensions (`.js` vs `.ts`)
3. Ensure TypeScript is configured correctly

### Async Tests Failing

Always use `async/await`:

```typescript
// ✅ Good
it('async test', async () => {
  const result = await asyncOp();
  expect(result).toBeDefined();
});

// ❌ Bad
it('async test', () => {
  const result = asyncOp(); // Missing await!
  expect(result).toBeDefined();
});
```

## Next Steps

- Review [TESTING.md](../../TESTING.md) for comprehensive testing documentation
- Explore [shared/__tests__/README.md](../../shared/__tests__/README.md) for examples
- Check [Vitest documentation](https://vitest.dev/) for advanced features

## Future Testing Plans

- [ ] Server-side integration tests
- [ ] Client-side component tests
- [ ] End-to-end tests with Playwright
- [ ] Performance benchmarks
- [ ] Snapshot testing for API responses

---

**Questions?** See the [Support page](../general/support.md) for help.

