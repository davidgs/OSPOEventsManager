# 🚀 OpenShift Deployment Guide
## OSPO Events Manager on Red Hat OpenShift

This guide provides **multiple deployment options** for deploying your OSPO Events Manager to Red Hat OpenShift **without changing any existing code or configurations**.

## 📋 Prerequisites

1. **OpenShift CLI (oc)** installed and configured
2. **Access to OpenShift cluster** with project creation permissions
3. **Container registry access** (if using private images)

### Install OpenShift CLI
```bash
# Download and install oc CLI
curl -L https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/openshift-client-linux.tar.gz -o oc.tar.gz
tar -xzf oc.tar.gz
sudo mv oc /usr/local/bin/
```

### Login to OpenShift
```bash
oc login https://your-openshift-cluster.com
```

## 🎯 Deployment Options

### **Option 1: Automated Script Deployment (Recommended)**

The simplest approach using our pre-built deployment script:

```bash
# Make script executable
chmod +x openshift-deploy.sh

# Deploy to OpenShift
./openshift-deploy.sh
```

**What it does:**
- ✅ Creates OpenShift project
- ✅ Deploys PostgreSQL using OpenShift template
- ✅ Deploys Keycloak with proper configuration
- ✅ Builds and deploys your application
- ✅ Configures nginx proxy
- ✅ Creates external routes
- ✅ Waits for all deployments to complete

---

### **Option 2: Kompose Conversion (Advanced)**

Convert your `docker-compose.yml` to OpenShift manifests:

```bash
# Use the kompose script
chmod +x openshift-kompose.sh
./openshift-kompose.sh
```

**What it does:**
- ✅ Installs kompose tool
- ✅ Converts docker-compose.yml to OpenShift manifests
- ✅ Applies all manifests to OpenShift
- ✅ Creates external routes

---

### **Option 3: Manual oc new-app (Custom)**

Deploy each component individually:

```bash
# Create project
oc new-project ospo-events-manager

# Deploy PostgreSQL
oc new-app postgresql-persistent \
  -p POSTGRESQL_USER=ospo_user \
  -p POSTGRESQL_PASSWORD=ospo_password \
  -p POSTGRESQL_DATABASE=ospo_events

# Deploy Keycloak
oc new-app quay.io/keycloak/keycloak:23.0.6 \
  --name=keycloak \
  -e KC_DB=postgres \
  -e KC_DB_URL=jdbc:postgresql://postgres:5432/ospo_events

# Build and deploy your app
oc new-app . --name=ospo-app --strategy=docker

# Deploy nginx
oc create configmap nginx-config --from-file=nginx.conf
oc new-app nginx:alpine --name=nginx
oc set volume dc/nginx --add --configmap-name=nginx-config --mount-path=/etc/nginx/nginx.conf --sub-path=nginx.conf

# Create route
oc expose service nginx --name=ospo-app-route
```

---

### **Option 4: OpenShift Web Console (GUI)**

1. **Login to OpenShift Web Console**
2. **Create New Project**: `ospo-events-manager`
3. **Add to Project** → **Import from Git**
4. **Git Repository URL**: Your repository URL
5. **Application Name**: `ospo-events-manager`
6. **Resources**: Select "Deployment"
7. **Advanced Options** → **Routing** → Create Route
8. **Create**

---

## 🔧 OpenShift-Specific Configurations

### **Security Context Constraints**

OpenShift runs containers with restricted security by default. If you encounter permission issues:

```bash
# Grant anyuid SCC to your service account (if needed)
oc adm policy add-scc-to-user anyuid -z default
```

### **Environment Variables**

Your existing environment variables from `docker-compose.yml` will be automatically applied.

### **Persistent Storage**

OpenShift will automatically create PersistentVolumeClaims for your volumes:
- PostgreSQL data: `postgres-data`
- Upload files: `uploads`

### **Networking**

OpenShift creates Services automatically for each container. Internal networking works the same as Docker Compose.

## 🌐 External Access

### **Routes vs Ingress**

OpenShift uses **Routes** instead of Ingress for external access:

```bash
# Create route for your application
oc expose service nginx --name=ospo-app-route

# Get the external URL
oc get route ospo-app-route -o jsonpath='{.spec.host}'
```

### **Custom Domain**

To use a custom domain:

```bash
oc create route edge ospo-app-custom --service=nginx --hostname=ospo.yourdomain.com
```

## 📊 Monitoring and Logging

### **View Logs**
```bash
# View application logs
oc logs -f dc/ospo-app

# View database logs
oc logs -f dc/postgres

# View Keycloak logs
oc logs -f dc/keycloak
```

### **Monitor Resources**
```bash
# Get pod status
oc get pods

# Get deployment status
oc get dc

# View events
oc get events --sort-by=.metadata.creationTimestamp
```

## 🔒 Security Considerations

### **Network Policies**

Your existing network isolation from Docker Compose is maintained in OpenShift through Services.

### **Secrets Management**

Convert sensitive environment variables to OpenShift Secrets:

```bash
# Create secret for database credentials
oc create secret generic db-credentials \
  --from-literal=username=ospo_user \
  --from-literal=password=ospo_password

# Create secret for Keycloak
oc create secret generic keycloak-credentials \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=admin123
```

### **RBAC**

OpenShift provides fine-grained RBAC out of the box. Your application will run with minimal required permissions.

## 📈 Scaling

### **Horizontal Pod Autoscaling**
```bash
# Enable autoscaling for your app
oc autoscale dc/ospo-app --min=2 --max=10 --cpu-percent=80

# Enable autoscaling for nginx
oc autoscale dc/nginx --min=2 --max=5 --cpu-percent=70
```

### **Manual Scaling**
```bash
# Scale your application
oc scale dc/ospo-app --replicas=3

# Scale nginx
oc scale dc/nginx --replicas=2
```

## 🚀 Production Considerations

### **Resource Limits**
```bash
# Set resource limits
oc set resources dc/ospo-app --limits=cpu=500m,memory=1Gi --requests=cpu=100m,memory=256Mi
oc set resources dc/postgres --limits=cpu=1000m,memory=2Gi --requests=cpu=500m,memory=1Gi
```

### **Health Checks**

OpenShift will automatically create health checks based on your `healthcheck` configurations from `docker-compose.yml`.

### **Backup Strategy**
```bash
# Backup PostgreSQL data
oc exec dc/postgres -- pg_dump -U ospo_user ospo_events > backup.sql
```

## 🎉 Deployment Verification

After deployment, verify everything is working:

```bash
# Check all pods are running
oc get pods

# Check routes are accessible
oc get routes

# Test the application
curl http://$(oc get route ospo-app-route -o jsonpath='{.spec.host}')/health
```

## 🆘 Troubleshooting

### **Common Issues**

1. **Image Pull Errors**: Ensure your container registry is accessible from OpenShift
2. **Permission Denied**: Check Security Context Constraints
3. **Database Connection**: Verify environment variables and network connectivity
4. **Route Not Working**: Check if the route is properly exposed

### **Debug Commands**
```bash
# Debug failing pod
oc describe pod <pod-name>

# Get detailed deployment info
oc describe dc/ospo-app

# Check events for errors
oc get events --sort-by=.metadata.creationTimestamp
```

## 📚 Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [OpenShift CLI Reference](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html)
- [Kompose Documentation](https://kompose.io/)

---

## 🎯 Quick Start Summary

1. **Login to OpenShift**: `oc login https://your-cluster.com`
2. **Run deployment script**: `./openshift-deploy.sh`
3. **Access your application**: Use the route URL provided
4. **Monitor**: `oc get pods` and `oc logs -f dc/ospo-app`

Your OSPO Events Manager is now running on OpenShift! 🚀