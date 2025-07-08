# OSPO Events Manager - OpenShift Deployment Guide

This guide provides step-by-step instructions for deploying the OSPO Events Manager to OpenShift using Helm.

## Prerequisites

1. **OpenShift Access**: You must have access to an OpenShift cluster with appropriate permissions
2. **OpenShift CLI**: Install the `oc` command-line tool
3. **Helm 3**: Install Helm 3.x
4. **Project Access**: You should have access to the `prod-rh-events-org` project

### Permission Requirements

The deployment requires the following permissions:

- **Admin access** to the `prod-rh-events-org` project

If you don't have project creation permissions and the project doesn't exist, ask your cluster administrator to run the setup script first:

```bash
# For cluster administrators only
./setup-projects.sh
```

This script will:
- Create the `prod-rh-events-org` project (if it doesn't exist)
- Grant appropriate permissions to specified users
- Verify the setup is correct

**Note:** Everything (application, database, Keycloak, MinIO, and Otterize security) is installed in the same project for simplicity and better resource management.

## Quick Start

### 1. Login to OpenShift

```bash
# Login to your OpenShift cluster
oc login --token=YOUR_TOKEN --server=https://your-openshift-cluster.com

# Verify you can access the project
oc project prod-rh-events-org
```

### 2. Navigate to the k8s Directory

```bash
cd k8s
```

### 3. Run the Deployment Script

```bash
./deploy-openshift.sh
```

The script will:
- Validate your OpenShift connection
- Check for required tools (Helm, oc)
- Optionally build the application image
- Deploy the complete OSPO Events Manager stack
- Provide you with access URLs and next steps

## Manual Deployment

If you prefer to deploy manually or need more control:

### 1. Build the Application Image

```bash
# Create a new build configuration
oc new-build --name=ospo-events-app --strategy=docker --binary=true

# Start the build from the project root
oc start-build ospo-events-app --from-dir=../ --follow

# Wait for the build to complete
oc get builds
```

### 2. Deploy Using Helm

```bash
# Install the application
helm install ospo-events ospo-app-chart \
  --namespace prod-rh-events-org \
  --values ospo-app-chart/values-openshift.yaml \
  --wait \
  --timeout=10m
```

### 3. Monitor the Deployment

```bash
# Check pod status
oc get pods -l app.kubernetes.io/instance=ospo-events

# Check routes
oc get routes -l app.kubernetes.io/instance=ospo-events

# View logs
oc logs -l app.kubernetes.io/component=application --tail=100
```

## Configuration

### Environment-Specific Values

Edit `ospo-app-chart/values-openshift.yaml` to customize:

- **Passwords**: Change default passwords for security
- **Resources**: Adjust CPU/memory limits based on your requirements
- **Storage**: Configure persistent volume sizes
- **Routes**: Set custom hostnames if needed
- **Security**: Enable/disable Otterize zero trust networking

### Otterize Security (Zero Trust Networking)

The chart includes optional Otterize integration for intent-based access control:

```yaml
otterize:
  enabled: true  # Enable zero trust networking
  credentials:
    clientId: "your-client-id"
    clientSecret: "your-client-secret"
  config:
    mode: "defaultShadow"  # Options: defaultShadow, defaultDeny, defaultAllow
    certificateProvider: "otterize-cloud"
```

**Otterize Modes:**
- `defaultShadow`: Monitor traffic without blocking (recommended for initial deployment)
- `defaultDeny`: Block all traffic except explicitly allowed intents (production security)
- `defaultAllow`: Allow all traffic (development/testing only)

**Benefits:**
- **Zero Trust**: Only explicitly allowed communication is permitted
- **Visibility**: Complete network traffic monitoring and logging
- **Compliance**: Automatic security policy generation and enforcement
- **Debugging**: Network intent violations help identify connectivity issues

### Security Considerations

1. **Change Default Passwords**:
   ```yaml
   postgresql:
     auth:
       password: "your-secure-password"

   keycloak:
     admin:
       password: "your-keycloak-admin-password"

   app:
     env:
       SESSION_SECRET: "your-secure-session-secret"
   ```

2. **Update Image Pull Policy**:
   ```yaml
   app:
     image:
       pullPolicy: Always  # For development
       # pullPolicy: IfNotPresent  # For production
   ```

## Accessing the Application

### Via OpenShift Routes

After deployment, get the application URL:

```bash
# Get the main application route
oc get route ospo-events -o jsonpath='{.spec.host}'

# Access the application
https://$(oc get route ospo-events -o jsonpath='{.spec.host}')
```

### Service URLs

- **Main Application**: `https://ospo-events-prod-rh-events-org.apps.your-cluster.com`
- **Keycloak Admin**: `https://ospo-events-keycloak-prod-rh-events-org.apps.your-cluster.com/auth`
- **MinIO Console**: `https://ospo-events-minio-prod-rh-events-org.apps.your-cluster.com`

## Managing Your Deployment

### Update Script

The `update-openshift.sh` script provides comprehensive update capabilities:

```bash
# Update everything (app + configuration)
./update-openshift.sh

# Update only application code
./update-openshift.sh -t app

# Update only configuration
./update-openshift.sh -t config -f values-openshift-secure.yaml

# Skip image rebuild (config changes only)
./update-openshift.sh -s

# Force update even if no changes detected
./update-openshift.sh --force

# Rollback to previous version
./update-openshift.sh -r 2
```

**Update Features:**
- **Smart Change Detection**: Automatically detects code and configuration changes
- **Atomic Updates**: Uses Helm's atomic flag to rollback on failure
- **Health Checks**: Verifies deployment health after updates
- **Rollback Support**: Easy rollback to any previous revision
- **Build Integration**: Automatically builds new container images when needed

### Monitoring Script

The `monitor-openshift.sh` script provides real-time monitoring:

```bash
# Quick status check
./monitor-openshift.sh

# Continuous monitoring (watch mode)
./monitor-openshift.sh -w

# View logs for all components
./monitor-openshift.sh -l

# Focus on specific component
./monitor-openshift.sh -c app -l
./monitor-openshift.sh -c postgres -w
./monitor-openshift.sh -c keycloak -l -n 200
```

**Monitoring Features:**
- **Real-time Status**: Pod, service, and route health
- **Resource Usage**: CPU and memory consumption
- **Log Aggregation**: Centralized log viewing
- **Health Checks**: Automatic endpoint testing
- **Event Tracking**: Recent cluster events

### Typical Update Workflow

1. **Make code changes** in your development environment
2. **Test updates** using the monitoring script:
   ```bash
   ./monitor-openshift.sh -w
   ```
3. **Deploy updates** when ready:
   ```bash
   ./update-openshift.sh
   ```
4. **Monitor deployment** progress:
   ```bash
   ./monitor-openshift.sh -w
   ```
5. **Rollback if needed**:
   ```bash
   ./update-openshift.sh -r $(./update-openshift.sh -h | grep "Current Revision" | awk '{print $3}')
   ```

## Troubleshooting

For comprehensive troubleshooting, see the [Troubleshooting Guide](TROUBLESHOOTING.md).

### Common Issues

1. **Permission Errors** (e.g., "namespaces is forbidden"):
   ```bash
   # Error: User cannot create namespaces/projects
   # Solution: Ask cluster admin to run the setup script
   ./setup-projects.sh

   # Or manually create projects:
   oc new-project prod-rh-events-org
   oc new-project otterize-system
   ```

2. **Image Pull Errors**:
   ```bash
   # Check if the image exists
   oc get imagestream ospo-events-app

   # Rebuild if necessary
   oc start-build ospo-events-app --from-dir=../ --follow
   ```

3. **Pod Startup Issues**:
   ```bash
   # Check events
   oc get events --sort-by=.metadata.creationTimestamp

   # Describe failed pods
   oc describe pod -l app.kubernetes.io/instance=ospo-events
   ```

4. **Database Connection Issues**:
   ```bash
   # Check PostgreSQL pod
   oc logs -l app.kubernetes.io/component=database

      # Test database connectivity
   oc exec -it deployment/postgres -- psql -U ospo_user -d ospo_events -c "SELECT version();"
   ```

5. **Keycloak Startup Issues**:
   ```bash
   # Check Keycloak logs
   oc logs -l app.kubernetes.io/component=auth

   # Check if database is ready
   oc get pods -l app.kubernetes.io/component=database
   ```

5. **Otterize/Network Security Issues**:
   ```bash
   # Check Otterize operator status
   oc get pods -n otterize-system

   # View network intents
   oc get clientintents -n prod-rh-events-org

   # Check for denied network traffic
   oc logs -n otterize-system -l app=intents-operator

   # View network policies created by Otterize
   oc get networkpolicies -n prod-rh-events-org
   ```

### Debug Commands

```bash
# Check all resources
oc get all -l app.kubernetes.io/instance=ospo-events

# Check persistent volumes
oc get pvc -l app.kubernetes.io/instance=ospo-events

# Check config maps
oc get configmap -l app.kubernetes.io/instance=ospo-events

# Check secrets
oc get secret -l app.kubernetes.io/instance=ospo-events

# Port forward for direct access (testing)
oc port-forward svc/ospo-events 4576:4576
```

## Updating the Application

### Upgrade with New Image

```bash
# Rebuild the image
oc start-build ospo-events-app --from-dir=../ --follow

# Upgrade the Helm release
helm upgrade ospo-events ospo-app-chart \
  --namespace prod-rh-events-org \
  --values ospo-app-chart/values-openshift.yaml \
  --wait \
  --timeout=10m
```

### Configuration Updates

```bash
# Update values file
vim ospo-app-chart/values-openshift.yaml

# Upgrade the deployment
helm upgrade ospo-events ospo-app-chart \
  --namespace prod-rh-events-org \
  --values ospo-app-chart/values-openshift.yaml
```

## Cleanup

### Remove the Application

```bash
# Uninstall the Helm release
helm uninstall ospo-events --namespace prod-rh-events-org

# Remove build configuration
oc delete bc ospo-events-app

# Remove image stream
oc delete imagestream ospo-events-app

# Clean up any remaining resources
oc delete all,pvc,configmap,secret -l app.kubernetes.io/instance=ospo-events
```

## Production Considerations

### Security

1. Use external databases for production
2. Configure proper RBAC
3. Use secrets management for sensitive data
4. Enable network policies
5. Configure resource quotas

### Monitoring

1. Enable monitoring stack integration
2. Configure alerts for critical services
3. Set up log aggregation
4. Monitor resource usage

### Backup

1. Schedule database backups
2. Backup persistent volumes
3. Export Keycloak realm configurations
4. Document disaster recovery procedures

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review OpenShift events and logs
3. Consult the main project documentation
4. Open an issue in the project repository

## Next Steps

After successful deployment:
1. Configure your first admin user in Keycloak
2. Set up the realm and client configurations
3. Create your first event in the system
4. Configure email notifications
5. Set up regular backups