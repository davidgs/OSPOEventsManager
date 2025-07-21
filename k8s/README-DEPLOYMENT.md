# OSPO Events Application Deployment Guide

This guide provides instructions for deploying the OSPO Events Management Application to OpenShift environments.

## Overview

The OSPO Events application consists of:
- **Main Application**: Node.js/Express backend with React frontend
- **PostgreSQL**: Database for storing events and user data
- **Keycloak**: Authentication and authorization server
- **MinIO**: Object storage for file uploads

## Prerequisites

- OpenShift cluster access
- `oc` CLI tool installed and logged in
- `helm` CLI tool installed (v3.x)
- Docker or Podman for building images

## Quick Start

### 1. Build the Application Image

```bash
# Navigate to the k8s directory
cd k8s

# Create a new build configuration
oc new-build --name=ospo-events-app --binary --strategy=docker --to=ospo-events-app:latest -n <namespace>

# Build and push the image
oc start-build ospo-events-app --from-dir=.. --follow -n <namespace>
```

### 2. Deploy to Development Environment

```bash
# Deploy using Helm with development values
helm install ospo-events-dev ./ospo-events-chart \
  -f ./ospo-events-chart/values-dev.yaml \
  --namespace dev-rh-events-org
```

### 3. Deploy to Production Environment

```bash
# Deploy using Helm with production values
helm install ospo-events-prod ./ospo-events-chart \
  -f ./ospo-events-chart/values-prod.yaml \
  --namespace prod-rh-events-org
```

## Configuration

### Environment-Specific Values

The deployment uses Helm charts with environment-specific value files:

- `values.yaml` - Default values
- `values-dev.yaml` - Development environment overrides
- `values-prod.yaml` - Production environment overrides

### Key Configuration Options

#### Application Configuration
```yaml
app:
  env:
    NODE_ENV: "development" # or "production"
    SESSION_SECRET: "your-secret-key"
  image:
    pullPolicy: Always # for dev, IfNotPresent for prod
```

#### Database Configuration
```yaml
postgresql:
  auth:
    username: "ospo_user"
    password: "secure-password"
    database: "ospo_events"
  persistence:
    size: 2Gi # or larger for production
```

#### Keycloak Configuration
```yaml
keycloak:
  admin:
    username: "admin"
    password: "secure-admin-password"
  client:
    id: "ospo-events-app"
    secret: "secure-client-secret"
```

## Database Initialization

The deployment includes automatic database initialization:

1. **Schema Migration**: Creates all necessary tables
2. **CSV Import**: Imports events from the provided CSV file (development only)

To enable/disable:
```yaml
dbInit:
  enabled: true
  csvImport:
    enabled: true # false for production
```

## Accessing the Application

After deployment, the application will be available at:
- **Development**: `https://ospo-events-dev-<namespace>.<domain>`
- **Production**: `https://ospo-events-prod-<namespace>.<domain>`

### Default Credentials

- **Keycloak Admin**: `admin` / `admin_dev` (development)
- **Database**: `ospo_user` / `ospo_password_dev` (development)

**⚠️ IMPORTANT**: Change all default passwords in production!

## Troubleshooting

### Common Issues

1. **Pods in CrashLoopBackOff**
   - Check logs: `oc logs <pod-name>`
   - Verify image is built and available
   - Check resource limits and requests

2. **Database Connection Issues**
   - Verify PostgreSQL is running: `oc get pods | grep postgresql`
   - Check database credentials match between services
   - Ensure network policies allow communication

3. **Keycloak Startup Issues**
   - Keycloak requires PostgreSQL to be ready first
   - Check database URL format is correct
   - Verify database credentials

4. **Image Pull Issues**
   - Ensure build completed successfully
   - Check image repository and tag names
   - Verify namespace has access to image registry

### Useful Commands

```bash
# Check deployment status
helm status ospo-events-dev -n <namespace>

# View all resources
oc get all -n <namespace>

# Check pod logs
oc logs deployment/ospo-events-dev-app -n <namespace>

# Access database directly
oc exec -it deployment/ospo-events-dev-postgresql -n <namespace> -- psql -U ospo_user -d ospo_events

# Port forward for local testing
oc port-forward service/ospo-events-dev-app 8080:80 -n <namespace>
```

## Upgrading

To upgrade an existing deployment:

```bash
# Rebuild image if needed
oc start-build ospo-events-app --from-dir=.. --follow -n <namespace>

# Upgrade using Helm
helm upgrade ospo-events-dev ./ospo-events-chart \
  -f ./ospo-events-chart/values-dev.yaml \
  --namespace <namespace>
```

## Uninstalling

To completely remove the deployment:

```bash
# Uninstall Helm release
helm uninstall ospo-events-dev -n <namespace>

# Clean up any remaining resources
oc delete pvc --all -n <namespace>
oc delete configmap --all -n <namespace>
```

## Security Considerations

1. **Change Default Passwords**: Update all default passwords in production
2. **Use Secrets**: Store sensitive data in Kubernetes secrets
3. **Network Policies**: Implement proper network segmentation
4. **RBAC**: Configure appropriate role-based access controls
5. **TLS**: Ensure all routes use TLS termination

## Known Issues

1. **Vite Permission Issue**: The main application may crash due to Vite trying to write to read-only directories. This is a known issue being addressed.

2. **Database Initialization**: The pg_isready command is not available in the Node.js Alpine image, causing database initialization jobs to hang.

3. **Keycloak Database Connection**: Keycloak may fail to connect to PostgreSQL if the database is not fully ready.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review pod logs for specific error messages
3. Verify configuration values match your environment
4. Contact the development team for assistance