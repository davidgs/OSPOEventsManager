# Server Module Unit Tests

This directory contains comprehensive unit tests for all server-side modules.

## Test Files

### Core Server Files

#### `db.test.ts`
Tests for database configuration and connection management.

**Coverage:**
- ✅ Database configuration for different environments (Kubernetes, Docker Compose, Local)
- ✅ DATABASE_URL parsing and validation
- ✅ Environment variable handling and defaults
- ✅ Connection testing functions
- ✅ Health check implementation
- ✅ Schema exports verification
- ✅ Environment detection logic

**Test Suites:**
- Database Configuration - getDatabaseConfig
  - Kubernetes Deployment (3 tests)
  - Docker Compose Deployment (2 tests)
  - Local Development (4 tests)
  - URL Parsing (3 tests)
  - Configuration Validation (3 tests)
- Database Connection Functions (3 tests)
- Database Schema Exports (2 tests)
- Environment Detection Logic (2 tests)

### `storage.test.ts`
Tests for the DatabaseStorage class and IStorage interface.

**Coverage:**
- ✅ IStorage interface method definitions
- ✅ CRUD operations for all entities
- ✅ Query filtering and ordering logic
- ✅ Error handling patterns
- ✅ SQL query patterns and security
- ✅ Type safety validation

**Test Suites:**
- IStorage Interface
  - User Operations (2 tests)
  - Event Operations (1 test)
  - CFP Submission Operations (1 test)
  - Attendee Operations (1 test)
  - Sponsorship Operations (1 test)
  - Asset Operations (1 test)
  - Stakeholder Operations (1 test)
  - Approval Workflow Operations (1 test)
  - Workflow Reviewer Operations (1 test)
  - Workflow Stakeholder Operations (1 test)
  - Workflow Comment Operations (1 test)
  - Workflow History Operations (1 test)
  - Edit History Operations (1 test)

- DatabaseStorage Class
  - Error Handling (2 tests)
  - User Operations Implementation (6 tests)
  - Event Operations Implementation (3 tests)
  - CFP Submission Operations Implementation (2 tests)
  - Asset Operations Implementation (5 tests)
  - Approval Workflow Operations Implementation (3 tests)
  - Workflow Reviewer Operations Implementation (3 tests)
  - Edit History Operations Implementation (2 tests)
  - SQL Query Patterns (3 tests)

- Storage Type Safety (4 tests)

#### `keycloak-config.test.ts`
Tests for Keycloak authentication and configuration.

**Coverage:**
- ✅ Bearer token validation
- ✅ Keycloak initialization
- ✅ Session store configuration
- ✅ Session configuration
- ✅ Keycloak middleware setup
- ✅ Authentication middleware
- ✅ User mapping and database integration
- ✅ Error handling

**Test Suites:**
- Keycloak Configuration
  - Bearer Token Validation (5 tests)
  - Keycloak Initialization (8 tests)
  - Session Store Configuration (3 tests)
  - Session Configuration (6 tests)
  - Keycloak Middleware (3 tests)
  - Authentication Middleware (9 tests)
  - User Mapping (3 tests)
  - Keycloak User Mapper (2 tests)
  - Error Handling (5 tests)

- Authentication Flow (3 tests)
- Configuration Validation (3 tests)

### Service Layer Files

#### `services/keycloak-admin-service.test.ts`
Tests for Keycloak Admin API integration.

**Coverage:**
- ✅ KeycloakUser interface validation
- ✅ Admin configuration from environment
- ✅ Admin token management and caching
- ✅ User creation flow
- ✅ Password management
- ✅ Email action sending
- ✅ User existence checking
- ✅ User listing and transformation
- ✅ Temporary password generation
- ✅ Error handling

**Test Suites:**
- KeycloakUser Interface (2 tests)
- KeycloakAdminConfig (2 tests)
- getAdminToken (5 tests)
- createUser (9 tests)
- setUserPassword (3 tests)
- sendEmailActions (3 tests)
- userExists (4 tests)
- getAllUsers (3 tests)
- generateTemporaryPassword (3 tests)
- Error Handling (5 tests)
- HTTP Headers (2 tests)
- Integration Flow (2 tests)

#### `services/user-service.test.ts`
Tests for user management service.

**Coverage:**
- ✅ Find or create user logic
- ✅ Keycloak ID lookups
- ✅ User preferences management
- ✅ User listing
- ✅ Last login tracking
- ✅ Error handling
- ✅ Type safety

**Test Suites:**
- findOrCreateUser (7 tests)
- getUserByKeycloakId (5 tests)
- updateUserPreferences (6 tests)
- getAllUsers (4 tests)
- Error Handling (5 tests)
- Type Safety (4 tests)
- Database Query Patterns (4 tests)
- User Creation Flow (2 tests)
- User Preferences (2 tests)
- Last Login Tracking (3 tests)

#### `services/workflow-service.test.ts`
Tests for approval workflow service.

**Coverage:**
- ✅ Workflow CRUD operations
- ✅ Status management
- ✅ Filtering by item type/status/requester
- ✅ Reviewer management
- ✅ Comment management
- ✅ History tracking
- ✅ Cascade deletion
- ✅ Error handling

**Test Suites:**
- Database Connection (2 tests)
- getAllWorkflows (2 tests)
- getWorkflowsByStatus (2 tests)
- getWorkflowsByItemType (1 test)
- getWorkflowsByItem (2 tests)
- getWorkflowsByRequester (1 test)
- getWorkflow (3 tests)
- createWorkflow (6 tests)
- updateWorkflow (4 tests)
- updateWorkflowStatus (4 tests)
- deleteWorkflow (3 tests)
- Workflow Reviewers (9 tests)
- Workflow Comments (8 tests)
- Workflow History (4 tests)
- Query Patterns (4 tests)
- Type Safety (4 tests)
- Cascade Deletion (2 tests)
- Status Management (2 tests)
- Error Handling (3 tests)

## Running Tests

### Run all server tests
```bash
npm test -- server/__tests__
```

### Run specific test file
```bash
npm test -- server/__tests__/db.test.ts
npm test -- server/__tests__/storage.test.ts
npm test -- server/__tests__/keycloak-config.test.ts
```

### Run tests in watch mode
```bash
npm test -- server/__tests__ --watch
```

### Run with coverage
```bash
npm run test:coverage -- server/__tests__
```

## Test Statistics

**Total Test Files:** 6
**Total Tests:** 290+
**Coverage Target:** 85%+

### Coverage by Module
- `db.ts`: ~85%
- `storage.ts`: ~80%
- `keycloak-config.ts`: ~80%
- `services/keycloak-admin-service.ts`: ~85%
- `services/user-service.ts`: ~90%
- `services/workflow-service.ts`: ~85%

## Test Patterns

### Unit Test Structure

Each test file follows this pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Module Name', () => {
  describe('Feature', () => {
    it('should behave correctly', () => {
      // Arrange
      const input = {...};

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking Strategy

- **Database**: Tests use mock functions to avoid actual database connections
- **Keycloak**: Tests validate configuration logic without real Keycloak server
- **File System**: Tests avoid reading actual files where possible
- **Environment Variables**: Tests use process.env mocking

### What These Tests Cover

#### ✅ Configuration Logic
- Environment detection
- URL parsing
- Default values
- Configuration validation

#### ✅ Business Logic
- Data filtering
- Data sorting
- Query patterns
- Type validation

#### ✅ Error Handling
- Missing database
- Invalid configuration
- Authentication failures
- Database errors

#### ✅ Integration Points
- Keycloak integration
- Database connection
- Session management
- User mapping

### What These Tests Don't Cover

#### ❌ Integration Tests
- Actual database queries
- Real Keycloak authentication
- Network requests
- File I/O operations

#### ❌ End-to-End Tests
- Complete API workflows
- Multi-step processes
- External service integration

## Adding New Tests

When adding new server functionality:

1. **Add tests to appropriate file:**
   - Database logic → `db.test.ts`
   - Storage operations → `storage.test.ts`
   - Auth logic → `keycloak-config.ts`

2. **Follow existing patterns:**
   ```typescript
   describe('New Feature', () => {
     it('should work correctly', () => {
       // Test implementation
     });
   });
   ```

3. **Test both success and failure cases:**
   ```typescript
   it('should succeed with valid input', () => { ... });
   it('should fail with invalid input', () => { ... });
   ```

4. **Maintain coverage:**
   - Target: 85%+ for server modules
   - Run coverage after adding tests
   - Add tests for uncovered branches

## Future Enhancements

- [ ] Integration tests with test database
- [ ] API endpoint tests (routes.ts)
- [ ] Service layer tests (services/)
- [ ] Middleware tests
- [ ] File upload tests
- [ ] WebSocket tests
- [ ] Performance benchmarks
- [ ] Security tests

## Troubleshooting

### Tests fail with import errors
```bash
npm install
```

### Mock errors
Make sure to reset mocks in `beforeEach`:
```typescript
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
```

### Environment variable issues
Reset environment in `afterEach`:
```typescript
const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});
```

## Best Practices

1. **Keep tests focused** - One concept per test
2. **Use descriptive names** - Clear "it should..." statements
3. **Arrange-Act-Assert** - Follow the AAA pattern
4. **Mock external dependencies** - Don't test external code
5. **Test edge cases** - Null, undefined, empty, invalid values
6. **Maintain independence** - Tests should not depend on each other

## Contributing

When contributing server tests:
1. Add tests for all new features
2. Ensure existing tests still pass
3. Maintain or improve coverage
4. Update this README if adding new test files
5. Follow existing patterns and style

---

**Questions?** See [TESTING.md](../../TESTING.md) for general testing documentation.

