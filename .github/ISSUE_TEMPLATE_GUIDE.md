# GitHub Issue Templates Guide

This directory contains standardized issue templates for the Events Manager project.

## Available Templates

### 🐛 Bug Report (`bug_report.md`)
Use this template to report bugs or unexpected behavior.

**When to use:**
- Application errors or crashes
- Features not working as expected
- UI/UX problems
- Data corruption or loss

**Key sections:**
- Environment details (browser, OS, deployment)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs
- Screenshots

### ✨ Feature Request (`feature_request.md`)
Use this template to suggest new features or enhancements.

**When to use:**
- Requesting new functionality
- Suggesting improvements to existing features
- Proposing workflow enhancements

**Key sections:**
- Problem statement and use cases
- Proposed solution
- User stories
- Benefits and priority
- Implementation ideas

### 📚 Documentation (`documentation.md`)
Use this template for documentation improvements.

**When to use:**
- Reporting missing documentation
- Correcting incorrect information
- Suggesting clarity improvements
- Fixing broken links or typos

**Key sections:**
- Documentation location
- Current state vs suggested improvement
- Target audience
- Priority

### 🔒 Security (`security.md`)
Use this template for security concerns.

**⚠️ IMPORTANT:** For critical vulnerabilities, email `security@your-domain.com` directly instead of creating a public issue.

**When to use:**
- Reporting security vulnerabilities (non-critical)
- Suggesting security enhancements
- Configuration security concerns
- Dependency vulnerabilities

**Key sections:**
- Severity assessment
- Affected components
- Impact analysis
- Suggested mitigation

### 🚀 Deployment (`deployment.md`)
Use this template for deployment-related issues.

**When to use:**
- Deployment failures
- Configuration problems
- OpenShift/Kubernetes issues
- Environment setup problems

**Key sections:**
- Environment and cluster details
- Deployment command and logs
- Pod status and logs
- Resource status
- Pre-deployment checklist

### ❓ Question (`question.md`)
Use this template to ask questions.

**When to use:**
- Asking "how-to" questions
- Clarifying functionality
- Seeking guidance on best practices

**Key sections:**
- Context and what you've tried
- Documentation already checked
- Specific question

## Template Configuration (`config.yml`)

The `config.yml` file configures the issue creation experience:

- **Blank issues**: Enabled (allows freeform issues)
- **Contact links**: Quick access to documentation, discussions, support, and security email

## Using the Templates

### From GitHub Web Interface

1. Navigate to the repository
2. Click the **Issues** tab
3. Click **New Issue**
4. Select the appropriate template
5. Fill in all required sections
6. Submit the issue

### Template Fields

- **Required fields**: Marked with comments or asterisks
- **Optional fields**: Provide if relevant
- **Checkboxes**: Check all that apply
- **Code blocks**: Use for logs, errors, and code snippets
- **Details/Summary**: Use for collapsible sections with lots of content

## Best Practices

### For Issue Reporters

1. **Search first**: Check if the issue already exists
2. **Use the right template**: Choose the most appropriate template
3. **Be specific**: Provide detailed, actionable information
4. **Include context**: Help others understand the problem
5. **One issue per report**: Don't combine multiple unrelated issues
6. **Follow up**: Respond to questions and test proposed fixes
7. **Update status**: Comment if you find a workaround or solution

### For Maintainers

1. **Triage promptly**: Review new issues within 48 hours
2. **Label appropriately**: Add relevant labels (bug, enhancement, etc.)
3. **Set priority**: Use priority labels (critical, high, medium, low)
4. **Assign milestone**: Add to appropriate milestone if applicable
5. **Request info**: Ask for missing details politely
6. **Close duplicates**: Link to the original issue
7. **Update status**: Keep the issue updated with progress

## Labels

Common labels used with these templates:

- **Type**: `bug`, `enhancement`, `documentation`, `security`, `deployment`, `question`
- **Priority**: `critical`, `high`, `medium`, `low`
- **Status**: `confirmed`, `investigating`, `in-progress`, `blocked`, `wontfix`
- **Component**: `frontend`, `backend`, `database`, `auth`, `deployment`
- **Area**: `events`, `cfp`, `assets`, `users`, `workflows`

## Issue Lifecycle

1. **New**: Issue created
2. **Triage**: Reviewed and labeled
3. **Confirmed**: Issue validated and accepted
4. **In Progress**: Work started
5. **Review**: PR under review
6. **Testing**: Being tested
7. **Done**: Fixed/implemented and closed
8. **Wontfix/Duplicate**: Closed without action (with explanation)

## Examples

### Good Bug Report
```markdown
**Title**: [BUG] Event creation fails with 500 error when CFP deadline is empty

**Environment**:
- Deployment: Prod
- Browser: Chrome 120
- Role: User

**Steps to Reproduce**:
1. Click "New Event"
2. Fill in required fields
3. Leave CFP deadline empty
4. Click "Create Event"

**Expected**: Event should be created without CFP deadline
**Actual**: 500 error returned
**Error**: `Cannot read property 'toISOString' of null`
```

### Good Feature Request
```markdown
**Title**: [FEATURE] Add bulk export for multiple events

**Problem**: Users need to manually export events one at a time for reporting

**Proposed Solution**: Add checkbox selection and "Export Selected" button

**Benefits**:
- Saves time for users managing many events
- Improves reporting workflow
- Used by admins weekly
```

## Security Disclosure

For **critical security vulnerabilities**:

1. **DO NOT** create a public issue
2. Email `security@your-domain.com` with:
   - Subject: "SECURITY: [Brief description]"
   - Details of the vulnerability
   - Steps to reproduce (if safe to share)
   - Suggested fix (if you have one)
3. Wait for acknowledgment before public disclosure
4. Follow responsible disclosure practices

## Questions or Feedback

- Questions about templates: Open a question issue
- Suggestions for improvement: Open a feature request
- Template bugs: Open a documentation issue

---

**Last Updated**: 2025-10-30
**Template Version**: 1.0.0

