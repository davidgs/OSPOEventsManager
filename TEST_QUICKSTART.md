# Test Suite Quick Start

## Installation

Install the test dependencies:

```bash
npm install
```

This installs:
- `vitest@2.1.8` - Testing framework
- `@vitest/ui@2.1.8` - Interactive test UI
- `@vitest/coverage-v8@2.1.8` - Coverage reporting

## Running Tests

### 1. Run All Tests (Recommended First Step)

```bash
npm test
```

**Expected Output:**
```
✓ shared/__tests__/database-types.test.ts (60+ tests)
✓ shared/__tests__/database-schema.test.ts (30+ tests)
✓ shared/__tests__/schema.test.ts (20+ tests)

Test Files  3 passed (3)
     Tests  100+ passed (100+)
```

### 2. Watch Mode (For Development)

```bash
npm test -- --watch
```

Tests automatically re-run when you save files.

### 3. Interactive UI (Recommended)

```bash
npm run test:ui
```

Opens a browser with:
- Visual test results
- Coverage visualization
- Detailed error messages
- Test execution time

### 4. Coverage Report

```bash
npm run test:coverage
```

Generates:
- Terminal summary
- HTML report at `coverage/index.html`
- JSON data at `coverage/coverage-final.json`

**Open the HTML report:**
```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

## Understanding the Tests

### Test Files

1. **`shared/__tests__/database-types.test.ts`**
   - Tests all Zod validation schemas
   - Tests enum types (priorities, statuses, etc.)
   - Tests insert/update schemas

2. **`shared/__tests__/database-schema.test.ts`**
   - Tests database table definitions
   - Verifies column names and types
   - Checks naming conventions

3. **`shared/__tests__/schema.test.ts`**
   - Tests re-exports
   - Verifies backward compatibility
   - Tests integrations

### What Each Test Does

#### ✅ Validation Tests
Ensure data meets requirements before database operations:
```typescript
✓ should validate valid event priority
✓ should reject invalid event priority
✓ should require username
```

#### ✅ Schema Tests
Verify database structure is correct:
```typescript
✓ users table should have correct columns
✓ events table should use snake_case naming
✓ should use _id suffix for foreign keys
```

#### ✅ Integration Tests
Test that everything works together:
```typescript
✓ should export all table definitions
✓ should maintain backward compatibility
✓ should validate complete event object
```

## Troubleshooting

### Issue: "Cannot find module 'vitest'"

**Solution:**
```bash
npm install
```

### Issue: Tests fail with import errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
# Run type checking
npm run check
```

### Issue: Tests timeout

**Solution:**
```bash
# Increase timeout
npm test -- --timeout=10000
```

## Next Steps

1. ✅ **Install dependencies:** `npm install`
2. ✅ **Run tests:** `npm test`
3. ✅ **View coverage:** `npm run test:coverage`
4. 📖 **Read documentation:**
   - [TESTING.md](./TESTING.md) - Comprehensive guide
   - [docs/developer/testing.md](./docs/developer/testing.md) - Developer guide
   - [shared/__tests__/README.md](./shared/__tests__/README.md) - Test details

## Writing Your First Test

Create a new test file:

```typescript
// shared/__tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('My Feature', () => {
  it('should work correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

Run your test:
```bash
npm test -- my-feature.test.ts
```

## Common Commands Cheat Sheet

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test -- database-types.test.ts

# Pattern matching
npm test -- -t "Event Priorities"

# Interactive UI
npm run test:ui

# Coverage
npm run test:coverage

# Verbose output
npm test -- --reporter=verbose

# Help
npm test -- --help
```

## Success Criteria

Your test suite is working correctly if:

1. ✅ All 100+ tests pass
2. ✅ Coverage is 90%+ for shared module
3. ✅ No TypeScript errors
4. ✅ Tests run in < 5 seconds

## Getting Help

- **Documentation:** See [TESTING.md](./TESTING.md)
- **Examples:** Review `shared/__tests__/*.test.ts`
- **Vitest Docs:** https://vitest.dev/
- **Support:** See [docs/general/support.md](./docs/general/support.md)

---

**Ready to test?** Run `npm test` to get started! 🚀

