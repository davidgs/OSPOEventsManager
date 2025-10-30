# Shared Module Unit Tests

This directory contains comprehensive unit tests for all files in the `shared` directory.

## Test Files

### `database-types.test.ts`
Tests for all database types, validation schemas, and type definitions.

**Coverage:**
- ✅ Enum constants validation (event priorities, types, goals, statuses, etc.)
- ✅ Zod schema validation for all enum types
- ✅ Insert schema validation for all entities
- ✅ Update schema validation for all entities
- ✅ Edge case handling (null values, arrays, unknown fields)

**Test Suites:**
- Database Types - Enums and Constants
  - Event Priorities (5 tests)
  - Event Types (3 tests)
  - Event Goals (4 tests)
  - Event Statuses (2 tests)
  - CFP Statuses (2 tests)
  - Asset Types (2 tests)
  - Stakeholder Roles (2 tests)
  - Approval Statuses (2 tests)
  - Approval Item Types (2 tests)

- Database Types - Insert Schemas
  - insertUserSchema (3 tests)
  - insertEventSchema (4 tests)
  - insertCFPSubmissionSchema (3 tests)
  - insertAttendeeSchema (3 tests)
  - insertAssetSchema (4 tests)
  - insertSponsorshipSchema (2 tests)
  - insertStakeholderSchema (2 tests)
  - insertApprovalWorkflowSchema (3 tests)

- Database Types - Update Schemas
  - updateUserProfileSchema (3 tests)
  - updateEventSchema (4 tests)
  - updateCFPSubmissionSchema (3 tests)

- Database Types - Edge Cases (3 tests)

### `database-schema.test.ts`
Tests for all database table definitions and schema structure.

**Coverage:**
- ✅ Table name verification
- ✅ Column existence checks
- ✅ Required vs optional fields
- ✅ Relationship fields
- ✅ Naming conventions (snake_case, _id suffixes)
- ✅ Timestamp field consistency

**Test Suites:**
- Database Schema - Table Definitions
  - users table (3 tests)
  - events table (4 tests)
  - cfpSubmissions table (2 tests)
  - attendees table (2 tests)
  - sponsorships table (2 tests)
  - assets table (3 tests)
  - stakeholders table (2 tests)
  - approvalWorkflows table (2 tests)
  - workflowReviewers table (2 tests)
  - workflowStakeholders table (2 tests)
  - workflowComments table (1 test)
  - workflowHistory table (2 tests)
  - editHistory table (2 tests)

- Database Schema - Table Relationships (2 tests)
- Database Schema - Consistent Naming (3 tests)

### `schema.test.ts`
Tests for the main schema file which re-exports everything for backward compatibility.

**Coverage:**
- ✅ Table exports verification
- ✅ Type exports verification
- ✅ Validation schema exports
- ✅ Legacy compatibility aliases
- ✅ Relation definitions
- ✅ Integration tests
- ✅ Type inference tests

**Test Suites:**
- Schema - Re-exports
  - Table Exports (1 test)
  - Type Exports (4 tests)
  - Legacy Compatibility Exports (2 tests)

- Schema - Relations (13 tests)
- Schema - Integration Tests (3 tests)
- Schema - Validation Integration (4 tests)
- Schema - Type Inference (3 tests)
- Schema - Complete Export Coverage (3 tests)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- database-types.test.ts
```

### Run tests matching a pattern
```bash
npm test -- -t "Event Priorities"
```

## Test Statistics

**Total Test Suites:** 3
**Total Tests:** 100+
**Coverage Target:** 90%+

### Coverage by File
- `database-types.ts`: ~95%
- `database-schema.ts`: ~90%
- `schema.ts`: ~95%

## Writing New Tests

When adding new functionality to the `shared` directory:

1. **Add tests to the appropriate test file:**
   - Type definitions → `database-types.test.ts`
   - Schema definitions → `database-schema.test.ts`
   - Re-exports and integrations → `schema.test.ts`

2. **Follow the existing structure:**
   ```typescript
   describe('Feature Name', () => {
     it('should do something specific', () => {
       // Arrange
       const input = {...};

       // Act
       const result = schema.safeParse(input);

       // Assert
       expect(result.success).toBe(true);
     });
   });
   ```

3. **Test both positive and negative cases:**
   - Valid data should pass validation
   - Invalid data should fail with appropriate errors

4. **Test edge cases:**
   - Null/undefined values
   - Empty arrays/objects
   - Boundary values
   - Type coercion

## Continuous Integration

These tests should be run:
- Before committing changes
- In the CI/CD pipeline
- Before deploying to production

## Troubleshooting

### Tests fail with import errors
Make sure all dependencies are installed:
```bash
npm install
```

### Coverage reports not generated
Ensure coverage dependencies are installed:
```bash
npm install --save-dev @vitest/coverage-v8
```

### TypeScript errors in tests
Run type checking:
```bash
npm run check
```

## Contributing

When contributing to the `shared` module:
1. Add tests for all new functionality
2. Ensure all tests pass
3. Maintain >90% code coverage
4. Update this README if adding new test files

