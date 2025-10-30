# Client-Side Unit Tests

This directory contains comprehensive unit tests for the client-side application code, focusing on utilities, hooks, contexts, and integration logic.

## Directory Structure

```
client/__tests__/
├── lib/                    # Tests for utility libraries
│   ├── utils.test.ts       # String safety, formatting, XSS protection
│   ├── date-utils.test.ts  # Date parsing and formatting utilities
│   ├── constants.test.ts   # Application constants validation
│   ├── keycloak.test.ts    # Keycloak authentication integration
│   └── queryClient.test.ts # React Query API client configuration
├── hooks/                  # Tests for React hooks
│   ├── use-mobile.test.tsx # Responsive design hook
│   └── use-toast.test.ts   # Toast notification system
├── contexts/               # Tests for React contexts
│   └── auth-context.test.tsx # Authentication context provider
└── README.md              # This file
```

## Test Coverage

### Library Tests (`lib/`)

#### `utils.test.ts` (308 tests)
- **String Safety Utilities**: Safe string conversion, case conversion, character access, capitalization
- **Utility Functions**: Class name merging, byte formatting, date formatting
- **XSS Protection**: HTML sanitization, text escaping, URL validation, content truncation

#### `date-utils.test.ts` (43 tests)
- **Date Parsing**: Safe parsing with null/undefined handling, various date formats
- **Date Formatting**: Custom formats, error handling, edge cases
- **Date Ranges**: Range formatting, validation, cross-month/year ranges

#### `constants.test.ts` (46 tests)
- **Approval Workflow Constants**: Statuses, item types, review statuses
- **Event Constants**: Priorities, types
- **User and Role Constants**: User roles, attendee roles, stakeholder roles
- **Asset Constants**: Asset types validation
- **Sponsorship Constants**: Levels, statuses
- **CFP Constants**: CFP submission statuses
- **Type Safety**: Readonly arrays, string types, naming conventions

#### `keycloak.test.ts` (52 tests)
- **Initialization**: Server config, environment variables, error handling
- **Authentication Flow**: Login, registration, logout
- **Session Management**: Token handling, authentication state
- **User Information**: User data extraction, role checking
- **API Integration**: Auth headers, request decoration

#### `queryClient.test.ts` (35 tests)
- **API Requests**: GET, POST, PUT, DELETE, PATCH methods
- **Request Configuration**: Headers, body formatting, FormData handling
- **Error Handling**: 401 redirects, non-OK responses
- **Query Functions**: Default query function, custom configurations
- **React Query Integration**: Client configuration, query parameters

### Hook Tests (`hooks/`)

#### `use-mobile.test.tsx` (13 tests)
- **Responsive Detection**: Mobile/desktop width detection
- **Breakpoint Handling**: Default and custom breakpoints
- **Resize Events**: Window resize handling, cleanup
- **Edge Cases**: Zero width, very large widths, rapid resizes

#### `use-toast.test.ts` (31 tests)
- **Toast Creation**: Title, description, unique IDs
- **Toast Control**: Dismiss, update, action handling
- **State Management**: Reducer actions, toast limits
- **React Integration**: Hook usage, listener cleanup

### Context Tests (`contexts/`)

#### `auth-context.test.tsx` (23 tests)
- **Provider Initialization**: Loading states, success/error handling
- **Authentication Flow**: Login, logout, OAuth callbacks
- **User State**: User data management, role checking
- **HOC Protection**: Route protection, role-based access
- **Error Handling**: Initialization errors, operation failures

## Running Tests

### Run All Client Tests
```bash
npm test -- client
```

### Run Specific Test File
```bash
npm test -- client/__tests__/lib/utils.test.ts
```

### Run Tests with UI
```bash
npm run test:ui
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Environment

- **Test Runner**: Vitest
- **Testing Library**: @testing-library/react
- **Environment**: jsdom (browser simulation)
- **Mocking**: Vitest mocks for external dependencies

## Testing Patterns

### 1. Utility Function Tests
```typescript
describe('utilityFunction', () => {
  it('should handle valid input', () => {
    expect(utilityFunction('valid')).toBe('expected');
  });

  it('should handle invalid input', () => {
    expect(utilityFunction(null)).toBe('fallback');
  });

  it('should handle edge cases', () => {
    expect(utilityFunction('')).toBe('edge-case-result');
  });
});
```

### 2. React Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useCustomHook', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current).toBe(initialValue);
  });

  it('should update on action', () => {
    const { result } = renderHook(() => useCustomHook());
    act(() => {
      result.current.action();
    });
    expect(result.current.value).toBe(updatedValue);
  });
});
```

### 3. Context Provider Tests
```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('CustomContext', () => {
  const wrapper = ({ children }) => (
    <CustomProvider>{children}</CustomProvider>
  );

  it('should provide context values', async () => {
    const { result } = renderHook(() => useCustomContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.initialized).toBe(true);
    });
  });
});
```

### 4. Mock External Dependencies
```typescript
vi.mock('@/lib/external', () => ({
  externalFunction: vi.fn(() => 'mocked'),
}));

// In test
import { externalFunction } from '@/lib/external';
expect(externalFunction).toHaveBeenCalled();
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clear Descriptions**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
4. **Mock External Dependencies**: Mock API calls, external libraries, and browser APIs
5. **Test Edge Cases**: Include tests for null, undefined, empty strings, and boundary conditions
6. **Cleanup**: Use `beforeEach` and `afterEach` to reset state and mocks
7. **Async Handling**: Use `waitFor` and `act` for asynchronous operations
8. **Error Testing**: Test both success and failure paths

## Common Test Utilities

### Window Mock
```typescript
const originalLocation = window.location;
beforeEach(() => {
  delete (window as any).location;
  window.location = { ...originalLocation, href: 'https://example.com/' } as any;
});
afterEach(() => {
  window.location = originalLocation;
});
```

### Fetch Mock
```typescript
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});
```

### Console Mock
```typescript
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code ...
consoleError.mockRestore();
```

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

Current coverage focuses on:
- Core utility functions (100%)
- Authentication and authorization logic (95%)
- API client configuration (90%)
- React hooks and contexts (85%)

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-commit hooks (if configured)

## Troubleshooting

### Tests Timing Out
- Increase timeout in test file: `it('test', () => {}, 10000)`
- Check for unresolved promises
- Verify mocks are properly configured

### Module Not Found
- Check path aliases in `vitest.config.ts`
- Verify imports use correct paths (`@/...`)
- Ensure modules are properly mocked

### DOM-Related Errors
- Verify `jsdom` environment is configured
- Check that `vitest.setup.ts` includes necessary polyfills
- Use `@testing-library/react` utilities for DOM interaction

## Contributing

When adding new client-side code:

1. **Write Tests First**: Consider TDD approach
2. **Test All Paths**: Cover success, error, and edge cases
3. **Update This README**: Document new test files
4. **Maintain Coverage**: Don't decrease overall coverage
5. **Follow Patterns**: Use established testing patterns
6. **Mock Appropriately**: Mock external dependencies consistently

## Related Documentation

- [Root Testing Guide](../../TESTING.md)
- [Server Tests](../../server/__tests__/README.md)
- [Shared Tests](../../shared/__tests__/README.md)
- [Test Suite Summary](../../TEST_SUITE_SUMMARY.md)

