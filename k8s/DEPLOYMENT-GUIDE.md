# OSPO Events Manager - Repeatable Deployment Guide

This guide provides a **single-command deployment** process for OSPO Events Manager that requires **no manual intervention** after deployment.

## Overview

The deployment now includes:
- ✅ **Automatic Keycloak realm and client configuration**
- ✅ **Automatic database schema creation**
- ✅ **Proper OpenShift route configuration**
- ✅ **Comprehensive deployment testing**
- ✅ **No manual post-deployment fixes required**

## Prerequisites

- OpenShift CLI (`oc`) installed and logged in
- Helm 3.x installed
- `kubectl`, `curl`, and `jq` installed (for testing)

## Quick Start

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd OSPOEventsManager/k8s
```

### 2. Single Command Deployment

**Option A: Direct Helm Command**
```bash
# Deploy to OpenShift
helm upgrade --install ospo-events ./ospo-app-chart \
  --namespace prod-rh-events-org \
  --create-namespace \
  --values ospo-app-chart/values-openshift.yaml \
  --wait --timeout=10m
```

**Option B: Using the Deployment Script (Recommended)**
```bash
# Deploy using the comprehensive script
./deploy-openshift.sh
```

The script provides additional checks, status reporting, and automatic testing.

### 3. Verify Deployment

```bash
# Run automated tests
./test-deployment.sh prod-rh-events-org ospo-events
```

### 4. Access Application

```bash
# Get application URL
oc get route ospo-events-ospo-app -n prod-rh-events-org -o jsonpath='{.spec.host}'
```

**That's it!** Your OSPO Events Manager is ready to use.

## What Happens Automatically

### Database Setup
- ✅ Creates PostgreSQL database with proper schema
- ✅ Sets up all required tables (users, events, attendees, etc.)
- ✅ Creates indexes for optimal performance
- ✅ Configures triggers for automatic timestamp updates

### Keycloak Configuration
- ✅ Creates `ospo-events` realm
- ✅ Configures public client for JavaScript app
- ✅ Sets up proper redirect URIs for OpenShift routes
- ✅ Configures OpenID Connect endpoints
- ✅ Adds required protocol mappers

### OpenShift Integration
- ✅ Creates secure routes with TLS termination
- ✅ Configures proper security contexts
- ✅ Sets up persistent volumes for file uploads
- ✅ Configures service accounts with minimal permissions

## Configuration Details

### Key Configuration Files

| File | Purpose |
|------|---------|
| `values-openshift.yaml` | OpenShift-specific configuration |
| `templates/configmap.yaml` | Keycloak realm configuration |
| `templates/post-start-job.yaml` | Database and Keycloak setup |
| `test-deployment.sh` | Deployment verification |

### Important Values

```yaml
# OpenShift domain (auto-detected)
openshift:
  domain: "apps.ospo-osci.z3b1.p1.openshiftapps.com"

# Application base URL
app:
  baseUrl: "https://ospo-events-ospo-app-prod-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com"

# Keycloak public URL
keycloak:
  publicUrl: "https://ospo-events-ospo-app-keycloak-prod-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com/auth"
```

## Testing

### Automated Testing

The deployment includes comprehensive automated tests:

```bash
# Run all tests
./test-deployment.sh prod-rh-events-org ospo-events

# Test specific components
./test-deployment.sh prod-rh-events-org ospo-events 600  # 10 minute timeout
```

### Manual Testing

1. **Visit Application**: Navigate to the app URL
2. **Test Login**: Click "Login" and authenticate
3. **Create Event**: Add a new event to verify functionality
4. **Upload Files**: Test file upload functionality
5. **Profile Management**: Update user profile

## Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check deployment status
kubectl get deployments -n prod-rh-events-org

# Check pod logs
kubectl logs -n prod-rh-events-org -l app.kubernetes.io/name=ospo-app

# Check events
kubectl get events -n prod-rh-events-org --sort-by=.metadata.creationTimestamp
```

#### 2. Authentication Issues
```bash
# Check Keycloak logs
kubectl logs -n prod-rh-events-org -l app.kubernetes.io/name=keycloak

# Verify realm configuration
curl -s https://$(oc get route ospo-events-keycloak -n prod-rh-events-org -o jsonpath='{.spec.host}')/auth/realms/ospo-events/.well-known/openid_configuration | jq .
```

#### 3. Database Issues
```bash
# Check database connectivity
kubectl exec -n prod-rh-events-org deployment/ospo-events-postgres -- psql -U ospo_user -d ospo_events -c "SELECT current_database();"

# Check table creation
kubectl exec -n prod-rh-events-org deployment/ospo-events-postgres -- psql -U ospo_user -d ospo_events -c "\dt"
```

### Reset Deployment

If you need to start fresh:

```bash
# Complete cleanup
helm uninstall ospo-events -n prod-rh-events-org
kubectl delete namespace prod-rh-events-org

# Wait for cleanup to complete
kubectl wait --for=delete namespace/prod-rh-events-org --timeout=300s

# Redeploy
helm upgrade --install ospo-events ./ospo-app-chart \
  --namespace prod-rh-events-org \
  --create-namespace \
  --values ospo-app-chart/values-openshift.yaml \
  --wait --timeout=10m
```

## Security Considerations

- **TLS**: All routes use TLS with edge termination
- **Authentication**: Keycloak provides OpenID Connect authentication
- **Database**: PostgreSQL runs with restricted permissions
- **Storage**: File uploads stored in persistent volumes with proper permissions
- **Network**: Services communicate over internal cluster network

## Monitoring

### Health Checks

```bash
# Application health
curl https://$(oc get route ospo-events-ospo-app -n prod-rh-events-org -o jsonpath='{.spec.host}')/api/health

# Keycloak health
curl https://$(oc get route ospo-events-keycloak -n prod-rh-events-org -o jsonpath='{.spec.host}')/auth/health
```

### Logs

```bash
# Application logs
kubectl logs -n prod-rh-events-org -l app.kubernetes.io/name=ospo-app -f

# Keycloak logs
kubectl logs -n prod-rh-events-org -l app.kubernetes.io/name=keycloak -f

# Database logs
kubectl logs -n prod-rh-events-org -l app.kubernetes.io/name=postgres -f
```

## Customization

### Environment-Specific Values

Create custom values files for different environments:

```yaml
# values-dev.yaml
app:
  baseUrl: "https://ospo-events-dev.example.com"
keycloak:
  publicUrl: "https://ospo-keycloak-dev.example.com/auth"
```

### Scaling

```yaml
# Scale application
app:
  replicas: 3
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 2000m
      memory: 2Gi
```

## Support

For issues or questions:
1. Check the automated test output
2. Review pod logs and events
3. Verify configuration matches this guide
4. Ensure OpenShift routes are accessible

## Changelog

### v2.0 - Repeatable Deployment
- ✅ Automated Keycloak realm creation
- ✅ Automatic database schema setup
- ✅ Fixed authentication configuration
- ✅ Comprehensive deployment testing
- ✅ Single-command deployment

### v1.0 - Initial Release
- Manual configuration required
- Post-deployment fixes needed
- Limited testing capability