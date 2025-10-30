# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and testing.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Manual workflow dispatch

**Jobs:**

#### Lint & Type Check
- Runs TypeScript type checking with `npm run check`
- Validates code quality and type safety

#### Test Suite
- Runs all 899 unit tests across shared, server, and client modules
- Generates coverage reports
- Uploads coverage to Codecov
- Archives test results as artifacts

#### Build
- Builds the application with `npm run build`
- Archives build artifacts for deployment
- Ensures the application can be built successfully

#### Security Scan
- Runs `npm audit` to check for vulnerable dependencies
- Runs Snyk security scanning (if token is configured)
- Continues on error to not block the pipeline

#### Summary
- Aggregates results from all jobs
- Posts a summary comment on pull requests
- Fails if any critical job fails

### 2. Test Suite (`test.yml`)

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches

**Jobs:**

#### Run Tests
- Executes the complete test suite (899 tests)
- Generates coverage reports
- Uploads coverage to Codecov
- Posts test results as PR comments
- Archives test results

## Setup Requirements

### Required Secrets

None of the workflows require secrets to run basic functionality. However, for enhanced features:

#### Optional Secrets

1. **CODECOV_TOKEN** (optional but recommended)
   - For uploading coverage reports to Codecov
   - Get token from [codecov.io](https://codecov.io)
   - Set in: Repository Settings → Secrets and variables → Actions → New repository secret

2. **SNYK_TOKEN** (optional)
   - For security vulnerability scanning with Snyk
   - Get token from [snyk.io](https://snyk.io)
   - Set in: Repository Settings → Secrets and variables → Actions → New repository secret

### Node.js Version

Both workflows use **Node.js 20.x** which matches the development environment.

## Workflow Features

### Test Results in PRs

When a pull request is created or updated, the CI pipeline will automatically:
- Run all tests
- Post a comment with test results
- Show pass/fail status for each CI job
- Include test statistics and coverage breakdown

Example PR comment:
```
🚀 CI Pipeline Results

| Job | Status |
|-----|--------|
| Lint & Type Check | ✅ success |
| Test Suite | ✅ success |
| Build | ✅ success |

🧪 Test Results

All 899 tests passed! (100% pass rate)

Breakdown:
- Shared: 143 tests ✅
- Server: 309 tests ✅
- Client: 552 tests ✅
```

### Artifacts

Both workflows archive important files:

**Test Results Artifact** (retained for 30 days)
- Coverage reports (HTML, JSON, text)
- Test logs
- Available in: Actions → Workflow run → Artifacts

**Build Artifacts** (retained for 7 days)
- Compiled application in `dist/` directory
- Ready for deployment
- Available in: Actions → Workflow run → Artifacts

## Usage

### Running Workflows

Workflows run automatically on push/PR. To manually trigger:

1. Go to: Actions → CI Pipeline → Run workflow
2. Select branch
3. Click "Run workflow"

### Viewing Results

1. Navigate to the "Actions" tab in GitHub
2. Click on a workflow run to see details
3. View job logs by clicking on individual jobs
4. Download artifacts from the workflow run page

### Local Testing

Before pushing, you can run the same checks locally:

```bash
# Type check
npm run check

# Run tests
npm test

# Generate coverage
npm run test:coverage

# Build application
npm run build

# Security audit
npm audit
```

## Status Badges

Add these badges to your README.md:

### CI Pipeline Status
```markdown
[![CI Pipeline](https://github.com/YOUR_USERNAME/OSPOEventsManager/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/OSPOEventsManager/actions/workflows/ci.yml)
```

### Test Suite Status
```markdown
[![Tests](https://github.com/YOUR_USERNAME/OSPOEventsManager/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/OSPOEventsManager/actions/workflows/test.yml)
```

### Code Coverage (if using Codecov)
```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/OSPOEventsManager/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/OSPOEventsManager)
```

## Troubleshooting

### Tests Failing in CI but Pass Locally

1. **Check Node.js version:** CI uses Node 20.x
2. **Check dependencies:** CI uses `npm ci` (clean install)
3. **Environment differences:** CI runs in Ubuntu, may have different behavior
4. **View full logs:** Click on the failed job in Actions for detailed output

### Coverage Upload Fails

1. **Codecov token:** Add `CODECOV_TOKEN` secret
2. **Coverage files:** Ensure `coverage/coverage-final.json` is generated
3. **Check logs:** Review the "Upload coverage" step logs

### Build Fails in CI

1. **Check TypeScript errors:** Run `npm run check` locally
2. **Missing dependencies:** Ensure all deps are in `package.json`
3. **Build script:** Test `npm run build` locally

### Security Scan Failures

Security scans run with `continue-on-error: true` so they won't block PRs. Review:
1. `npm audit` output for vulnerabilities
2. Update dependencies: `npm audit fix`
3. Check Snyk dashboard for detailed reports

## Customization

### Change Node.js Version

Edit the `node-version` in workflow files:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'  # Change to desired version
```

### Add More Jobs

Add new jobs to `ci.yml`:

```yaml
new-job:
  name: New Job Name
  runs-on: ubuntu-latest
  needs: test  # Optional: wait for other jobs
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    # Add your steps here
```

### Modify Triggers

Edit the `on:` section:

```yaml
on:
  push:
    branches:
      - main
      - feature/*  # Add pattern matching
  schedule:
    - cron: '0 0 * * 0'  # Run weekly
```

## Best Practices

1. **Keep workflows fast:** Current test suite runs in ~4-5 minutes
2. **Use caching:** Node modules are cached automatically
3. **Fail fast:** TypeCheck runs before tests to catch issues early
4. **Archive artifacts:** Important for debugging failed runs
5. **Comment on PRs:** Provides immediate feedback to contributors

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Project Testing Guide](../../TESTING.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
- [Test Suite Summary](../../TEST_SUITE_SUMMARY.md)

---

**Last Updated:** October 30, 2025

