# Testing Documentation

This document describes the testing strategy and practices for the OSPO Events Manager application.

## Overview

The project uses [Vitest](https://vitest.dev/) as the primary testing framework. Vitest is a fast, modern test runner that works seamlessly with Vite and provides excellent TypeScript support.

## Test Structure

```
OSPOEventsManager/
├── shared/
│   └── __tests__/
│       ├── database-types.test.ts    # Type and schema validation tests
│       ├── database-schema.test.ts   # Database table structure tests
│       ├── schema.test.ts            # Re-export and integration tests
│       └── README.md                 # Shared module test documentation
├── server/
│   └── __tests__/                    # (Future) Server-side tests
├── client/
│   └── __tests__/                    # (Future) Client-side tests
├── vitest.config.ts                  # Vitest configuration
└── TESTING.md                        # This file
```

## Running Tests

### Install Dependencies

First, ensure all dependencies are installed:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Automatically re-run tests when files change:

```bash
npm test -- --watch
```

### Run Tests with UI

Launch an interactive test UI in your browser:

```bash
npm run test:ui
```

### Run Tests with Coverage

Generate code coverage reports:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Run Specific Tests

Run a specific test file:

```bash
npm test -- database-types.test.ts
```

Run tests matching a pattern:

```bash
npm test -- -t "Event Priorities"
```

Run tests in a specific directory:

```bash
npm test -- shared/__tests__
```

## Test Configuration

### Vitest Configuration

The project's Vitest configuration is in `vitest.config.ts`:

```typescript
{
  test: {
    globals: true,           // Use global test APIs
    environment: 'node',     // Node.js test environment
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build', '.cursor'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
  }
}
```

### Path Aliases

The test configuration includes path aliases for easier imports:

- `@` → `./client/src`
- `@shared` → `./shared`
- `@server` → `./server`

## Testing Guidelines

### Test Organization

1. **Group related tests using `describe` blocks:**

```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

2. **Use descriptive test names:**

```typescript
// ✅ Good
it('should validate valid event priority', () => { ... });

// ❌ Bad
it('test1', () => { ... });
```

3. **Follow the Arrange-Act-Assert pattern:**

```typescript
it('should validate valid user', () => {
  // Arrange
  const validUser = {
    username: 'testuser',
    email: 'test@example.com',
  };

  // Act
  const result = insertUserSchema.safeParse(validUser);

  // Assert
  expect(result.success).toBe(true);
});
```

### Test Coverage

Target coverage levels:
- **Overall:** 80%+
- **Shared module:** 90%+
- **Server routes:** 80%+
- **Server utilities:** 85%+

Areas that may have lower coverage:
- UI components (visual testing may be more appropriate)
- Integration points with external services
- Configuration files

### What to Test

#### ✅ Always Test

1. **Type validation:**
   - Valid data passes validation
   - Invalid data fails validation
   - Edge cases (null, undefined, empty)

2. **Business logic:**
   - Core functionality
   - Calculations and transformations
   - State transitions

3. **Error handling:**
   - Error conditions are caught
   - Appropriate error messages
   - Graceful degradation

4. **Integration points:**
   - Database queries
   - API endpoints
   - External service calls

#### ❌ Don't Test

1. **Third-party libraries:**
   - Trust that popular libraries are tested
   - Test your usage of the library

2. **Framework code:**
   - Don't test React, Express, etc.
   - Test your components/routes

3. **Generated code:**
   - Drizzle ORM generated types
   - Auto-generated API clients

### Writing Good Tests

#### Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good - independent test
it('should create user', () => {
  const user = { username: 'test' };
  const result = createUser(user);
  expect(result).toBeDefined();
});

// ❌ Bad - depends on previous test
let userId: number;
it('should create user', () => {
  const user = { username: 'test' };
  userId = createUser(user).id;
});
it('should find user', () => {
  const user = findUser(userId);
  expect(user).toBeDefined();
});
```

#### Test One Thing

Each test should verify one specific behavior:

```typescript
// ✅ Good - tests one thing
it('should validate username is required', () => {
  const result = insertUserSchema.safeParse({});
  expect(result.success).toBe(false);
});

// ❌ Bad - tests multiple things
it('should validate user', () => {
  expect(validate({})).toBe(false);
  expect(validate({ username: 'test' })).toBe(true);
  expect(validate({ username: '' })).toBe(false);
});
```

#### Use Clear Assertions

Make assertions explicit and easy to understand:

```typescript
// ✅ Good
expect(result.success).toBe(true);
expect(result.data.username).toBe('testuser');

// ❌ Bad
expect(result).toBeTruthy();
expect(result.data).toMatchObject({ username: expect.anything() });
```

## Test Types

### Unit Tests

Test individual functions, classes, or modules in isolation.

**Location:** `shared/__tests__/`

**Example:**
```typescript
it('should validate event priority', () => {
  const result = eventPrioritySchema.safeParse('high');
  expect(result.success).toBe(true);
});
```

### Integration Tests

Test how multiple components work together.

**Location:** `server/__tests__/integration/` (future)

**Example:**
```typescript
it('should create event and associate with user', async () => {
  const user = await createUser({ username: 'test' });
  const event = await createEvent({
    name: 'Test Event',
    created_by_id: user.id
  });
  expect(event.created_by_id).toBe(user.id);
});
```

### End-to-End Tests

Test complete user workflows.

**Location:** `e2e/` (future)

**Example:**
```typescript
it('should allow user to create and publish event', async () => {
  await page.goto('/events/new');
  await page.fill('[name="name"]', 'My Event');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/events\/\d+/);
});
```

## Mocking

### When to Mock

1. **External services:**
   - HTTP requests
   - Database calls
   - File system operations

2. **Slow operations:**
   - Network calls
   - Heavy computations
   - Time-dependent operations

3. **Non-deterministic behavior:**
   - Random number generation
   - Date/time
   - External APIs

### Vitest Mocking

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn(() => 'mocked value');

// Mock a module
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => ({ id: 1, name: 'Test' })),
}));

// Mock timers
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-01'));
```

## Continuous Integration

Tests should be run automatically in CI/CD:

```yaml
# .github/workflows/test.yml (example)
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

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug in Browser

Use the Vitest UI:

```bash
npm run test:ui
```

Then click on any test to see detailed results and debug information.

### Verbose Output

Run tests with verbose output:

```bash
npm test -- --reporter=verbose
```

## Common Issues

### Test Timeout

If tests take too long:

```typescript
it('slow test', async () => {
  // Increase timeout for this test
  vi.setConfig({ testTimeout: 10000 });

  await slowOperation();
}, 10000); // 10 second timeout
```

### Async Tests

Always wait for async operations:

```typescript
// ✅ Good
it('async test', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// ❌ Bad - missing await
it('async test', async () => {
  const result = asyncOperation(); // Missing await!
  expect(result).toBeDefined();
});
```

### Module Import Errors

If you see "Cannot find module" errors:

1. Check `vitest.config.ts` path aliases
2. Ensure file extensions match (`.js` vs `.ts`)
3. Verify TypeScript configuration

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Zod Testing Guide](https://zod.dev/)

## Future Improvements

- [ ] Add server-side integration tests
- [ ] Add client-side component tests
- [ ] Add end-to-end tests with Playwright
- [ ] Set up test coverage reporting in CI
- [ ] Add performance benchmarks
- [ ] Add snapshot testing for API responses

