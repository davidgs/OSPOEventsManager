---
name: Security Vulnerability
about: Report a security vulnerability (PRIVATE)
title: '[SECURITY] '
labels: security
assignees: ''

---

<!--
⚠️ IMPORTANT: Do NOT include sensitive details in public issues!

For critical security vulnerabilities:
1. Email security@[your-domain] directly
2. Do NOT create a public issue
3. Include "SECURITY" in the subject line
4. Wait for acknowledgment before public disclosure

For non-critical security improvements, continue below.
-->

## Security Issue Type
<!-- Select the type of security concern -->
- [ ] Vulnerability (potential exploit)
- [ ] Security enhancement suggestion
- [ ] Security best practice recommendation
- [ ] Configuration security concern
- [ ] Dependency vulnerability

## Severity (if vulnerability)
- [ ] Critical - Immediate action required
- [ ] High - Should be addressed urgently
- [ ] Medium - Should be addressed soon
- [ ] Low - Minor security concern

## Description
<!-- Provide a general description without exposing the exploit -->

## Affected Components
<!-- What parts of the application are affected? -->
- [ ] Authentication/Authorization
- [ ] API endpoints
- [ ] Database
- [ ] File uploads
- [ ] Frontend
- [ ] Configuration
- [ ] Dependencies
- [ ] Other:

## Environment
- **Deployment**: [Dev / Prod / Both]
- **Version**: [Application version]
- **Components**: [Specific components affected]

## Impact Assessment
<!-- What could an attacker do? (general terms) -->
- **Confidentiality**: [None / Low / Medium / High]
- **Integrity**: [None / Low / Medium / High]
- **Availability**: [None / Low / Medium / High]
- **Scope**: [Single user / Multiple users / All users / System-wide]

## Steps to Reproduce (if applicable)
<!-- Only if this is a security enhancement, NOT a vulnerability -->
<!-- Do NOT provide exploit details in public issues -->

## Suggested Mitigation
<!-- What steps could address this concern? -->

## Additional Context
<!-- Any other relevant information -->

## CVE References
<!-- If related to known CVEs -->
- CVE-XXXX-XXXXX:

## Related Security Issues
<!-- Link to related security issues (if public) -->
- Related to #

---

**For Maintainers:**
- [ ] Security issue triaged
- [ ] Severity confirmed
- [ ] Security advisory created (if needed)
- [ ] Fix developed
- [ ] Fix tested
- [ ] Security patch released
- [ ] CVE assigned (if applicable)
- [ ] Public disclosure prepared
- [ ] Users notified

**Security Response SLA:**
- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

