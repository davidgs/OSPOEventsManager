# GitHub Issue Templates

## Overview

Comprehensive GitHub issue templates have been created for the Events Manager project to streamline issue reporting and improve collaboration.

## Templates Created

### 📁 Location
`.github/ISSUE_TEMPLATE/`

### ✅ Available Templates

1. **🐛 Bug Report** (`bug_report.md`)
   - Standardized format for reporting bugs
   - Sections: Environment, Steps to Reproduce, Expected/Actual Behavior, Logs
   - Labels: `bug`

2. **✨ Feature Request** (`feature_request.md`)
   - Template for suggesting new features
   - Sections: Problem Statement, Proposed Solution, Use Cases, Benefits
   - Labels: `enhancement`

3. **📚 Documentation** (`documentation.md`)
   - For documentation improvements
   - Sections: Location, Issue Type, Current/Suggested State
   - Labels: `documentation`

4. **🔒 Security** (`security.md`)
   - Security vulnerability reporting
   - **Note**: Critical vulnerabilities should be reported privately via email
   - Sections: Severity, Impact Assessment, Affected Components
   - Labels: `security`

5. **🚀 Deployment** (`deployment.md`)
   - Deployment and configuration issues
   - Sections: Environment, Deployment Logs, Pod Status, Resource Status
   - Labels: `deployment`

6. **❓ Question** (`question.md`)
   - General questions and how-to inquiries
   - Sections: Context, What You've Tried, Documentation Checked
   - Labels: `question`

### ⚙️ Configuration

**`config.yml`** - Configures the issue creation experience:
- Enables blank issues (for freeform reporting)
- Provides quick links to:
  - 📚 Documentation (https://rh-events.org/docs)
  - 💬 Discussion Forum
  - 🆘 Support
  - 🔒 Security Email (private reporting)

### 📖 Guide

**`ISSUE_TEMPLATE_GUIDE.md`** - Comprehensive guide covering:
- When to use each template
- Best practices for reporters and maintainers
- Issue lifecycle
- Examples of good issues
- Security disclosure process
- Label system

## Key Features

### For Issue Reporters
- ✅ **Structured format** ensures all necessary information is provided
- ✅ **Dropdown selections** for common values
- ✅ **Checklists** for environment details and troubleshooting steps
- ✅ **Collapsible sections** for logs and detailed output
- ✅ **Clear guidance** on what information to include
- ✅ **Priority indicators** help communicate urgency

### For Maintainers
- ✅ **Consistent format** makes triage easier
- ✅ **Pre-filled labels** automatically categorize issues
- ✅ **Checklist sections** at the bottom for tracking progress
- ✅ **Priority and impact** information upfront
- ✅ **Related issues** section for linking

### Security Features
- ⚠️ **Clear warnings** about not posting critical vulnerabilities publicly
- 📧 **Email contact** for private security disclosures
- 🔒 **Severity assessment** framework
- 📋 **Impact analysis** template
- ⏱️ **SLA guidance** for security responses

## Usage

### Creating an Issue

1. Go to the repository's **Issues** tab
2. Click **New Issue**
3. Select the appropriate template
4. Fill in all sections (especially required ones)
5. Add any relevant labels, assignees, or milestones
6. Submit the issue

### Template Customization

To customize templates for your needs:

1. Edit files in `.github/ISSUE_TEMPLATE/`
2. Update `config.yml` with your URLs and contacts
3. Modify sections to match your workflow
4. Test by creating a new issue

## Integration with Documentation

The templates reference the in-app documentation system:
- Links to `/docs` pages in the application
- References to FAQ and troubleshooting guides
- Encourages checking documentation before reporting

## Best Practices Enforced

1. **Search Before Creating**: Templates remind users to search for existing issues
2. **Complete Information**: Required fields ensure actionable reports
3. **Environment Details**: Captured systematically for debugging
4. **Reproducible Steps**: Bug reports require step-by-step reproduction
5. **Impact Assessment**: Feature requests include priority and benefits
6. **Security First**: Critical vulnerabilities handled privately

## Label System

Templates automatically suggest labels:
- **Type**: bug, enhancement, documentation, security, deployment, question
- **Priority**: critical, high, medium, low
- **Status**: confirmed, investigating, in-progress, blocked
- **Component**: frontend, backend, database, auth

## Issue Lifecycle

```
New → Triage → Confirmed → In Progress → Review → Testing → Done
                                                           ↓
                                                      Wontfix/Duplicate
```

## Benefits

✅ **Faster Triage**: Consistent format speeds up review
✅ **Better Information**: Required fields ensure completeness
✅ **Improved Collaboration**: Clear structure helps contributors
✅ **Professional Process**: Shows project maturity
✅ **Security Awareness**: Proper handling of security issues
✅ **Documentation Integration**: Links to project docs
✅ **User-Friendly**: Clear guidance for all user types

## Next Steps

1. **Update config.yml**: Replace placeholder URLs with actual links
2. **Configure Labels**: Set up label system in GitHub repository
3. **Train Team**: Share ISSUE_TEMPLATE_GUIDE.md with contributors
4. **Monitor Usage**: Track which templates are most used
5. **Iterate**: Improve templates based on feedback

## Examples

### Good Issue Titles

✅ Good:
- `[BUG] Event creation fails with empty CFP deadline`
- `[FEATURE] Add bulk export for events`
- `[DOCS] Getting Started guide missing Keycloak setup`
- `[DEPLOY] PostgreSQL pod stuck in CrashLoopBackOff`

❌ Bad:
- `Bug in app`
- `Feature request`
- `Help needed`
- `Not working`

## Support Channels

- **Issues**: Bug reports, feature requests, documentation
- **Discussions**: General questions, ideas, community support
- **Security Email**: Critical security vulnerabilities
- **In-App Docs**: Self-service help and guides

---

**Created**: 2025-10-30
**Version**: 1.0.0
**Location**: `.github/ISSUE_TEMPLATE/`
**Files Created**: 7 templates + 1 config + 1 guide

