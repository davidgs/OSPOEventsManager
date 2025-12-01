# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead, please report it via one of the following methods:

### Preferred Method: GitHub Security Advisory

1. Go to the [Security tab](https://github.com/YOUR_USERNAME/OSPOEventsManager/security) in the repository
2. Click "Report a vulnerability"
3. Fill out the security advisory form

### Alternative Methods

- **Email**: security@yourdomain.com (if available)
- **Private Message**: Contact repository maintainers directly

## Security Best Practices

### Deployment Security

When deploying to production environments:

1. **OpenShift**: Use proper RBAC, network policies, and secure routes
2. **GKE**: Enable private clusters, use Workload Identity, configure network policies
3. **EKS**: Use IAM roles for service accounts, enable encryption, configure security groups
4. **Local/KIND**: Never use for production - development only

### Environment Variables

- Never commit `.env` files to version control
- Use secrets management (OpenShift Secrets, GCP Secret Manager, AWS Secrets Manager)
- Rotate credentials regularly
- Use strong, randomly generated passwords

### Image Security

- Regularly update base images
- Scan images for vulnerabilities
- Use image signing and verification
- Pull images from trusted registries only

### Network Security

- Use TLS/HTTPS for all external communications
- Configure proper CORS policies
- Use network policies to restrict pod-to-pod communication
- Enable firewall rules in cloud environments

### Authentication & Authorization

- Use Keycloak with strong password policies
- Enable MFA where possible
- Implement proper role-based access control (RBAC)
- Regularly audit user access

### Database Security

- Use encrypted connections (TLS)
- Restrict database access to application pods only
- Use strong database passwords
- Regularly backup and test restore procedures
- Enable database audit logging

### File Upload Security

- Validate file types and sizes
- Scan uploaded files for malware
- Store uploads outside web root
- Use secure storage (encrypted volumes, S3 with encryption)

## Security Updates

Security updates will be released as soon as possible after discovery and verification. Critical security issues will be addressed within 48 hours.

## Security Checklist

Before deploying to production:

- [ ] All dependencies updated to latest secure versions
- [ ] Environment variables secured (not in code)
- [ ] TLS/SSL certificates valid and properly configured
- [ ] Database credentials rotated and secured
- [ ] Keycloak configured with strong security policies
- [ ] Network policies configured
- [ ] Image scanning completed
- [ ] Backup and restore procedures tested
- [ ] Monitoring and alerting configured
- [ ] Access logs enabled and reviewed
- [ ] Security patches applied to base images
- [ ] RBAC properly configured
- [ ] Secrets management in place

## Known Security Considerations

### Multi-Platform Deployment

When deploying across multiple platforms (OpenShift, GKE, EKS):

- Each platform has different security models and best practices
- Ensure consistent security policies across all platforms
- Use platform-specific security features (e.g., GCP Workload Identity, AWS IAM Roles)
- Regularly audit configurations for each platform

### Image Registry Security

- GCR/ECR: Use service accounts with minimal required permissions
- Docker Hub: Use authentication tokens, not passwords
- Enable image scanning in cloud registries
- Use private registries when possible

## Security Contact

For security-related questions or concerns, please use the [Security Advisory](https://github.com/YOUR_USERNAME/OSPOEventsManager/security/advisories/new) feature on GitHub.

