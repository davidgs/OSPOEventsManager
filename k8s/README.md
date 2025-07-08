# OSPO Events Manager - Kubernetes/OpenShift Deployment

This directory contains Helm charts and deployment scripts for deploying the OSPO Events Manager to Kubernetes or OpenShift.

## 🚀 New Repeatable Deployment Process

We've redesigned the deployment to be **fully automated** and **repeatable** without manual intervention.

### ✅ Key Features

- **Single-command deployment** with comprehensive configuration
- **Automatic Keycloak realm and client setup**
- **Automatic database schema creation**
- **Proper OpenShift route configuration**
- **Comprehensive deployment testing**
- **No manual post-deployment fixes required**

## Prerequisites

- OpenShift CLI (`oc`) installed and logged in
- Helm 3.x installed
- `kubectl`, `curl`, and `jq` installed (for testing)

## 🎯 Quick Start

### 1. Deploy to OpenShift (Recommended)

```bash
# Simply run the deployment script
./deploy-openshift.sh
```

**That's it!** The script will:
- ✅ Check all prerequisites
- ✅ Validate the Helm chart
- ✅ Deploy all components
- ✅ Set up database schema automatically
- ✅ Configure Keycloak realm and client
- ✅ Run comprehensive tests
- ✅ Display access URLs

### 2. Manual Helm Deployment

If you prefer to run Helm directly:

```bash
# Deploy using Helm
helm upgrade --install ospo-events ./ospo-app-chart \
  --namespace prod-rh-events-org \
  --create-namespace \
  --values ospo-app-chart/values-openshift.yaml \
  --wait --timeout=15m

# Test the deployment
./test-deployment.sh prod-rh-events-org ospo-events
```

## 📋 Components

The deployment includes:

### 1. **PostgreSQL Database**
- **Purpose**: Stores all application data
- **Credentials**: ospo_user / ospo_password_change_me
- **Database**: ospo_events
- **Auto-setup**: Complete schema with tables, indexes, and triggers

### 2. **Keycloak Authentication**
- **Purpose**: OpenID Connect authentication server
- **Admin**: admin / admin_change_me
- **Realm**: ospo-events (automatically created)
- **Client**: ospo-events-app (public client for JavaScript)
- **Auto-setup**: Realm, client, and protocol mappers

### 3. **MinIO Object Storage**
- **Purpose**: File upload storage
- **Credentials**: minioadmin / minioadmin_change_me
- **Auto-setup**: Buckets and permissions

### 4. **OSPO Events Application**
- **Purpose**: Main application server
- **Auto-setup**: All environment variables and connections

## 🌐 Access URLs

After deployment, access the application via:

```bash
# Get the application URL
oc get route ospo-events-ospo-app -n prod-rh-events-org -o jsonpath='{.spec.host}'

# Get the Keycloak admin URL
oc get route ospo-events-keycloak -n prod-rh-events-org -o jsonpath='{.spec.host}'
```

## 🔧 Configuration

### Key Configuration Files

| File | Purpose |
|------|---------|
| `deploy-openshift.sh` | **Main deployment script** |
| `test-deployment.sh` | Comprehensive testing script |
| `DEPLOYMENT-GUIDE.md` | Detailed deployment documentation |
| `ospo-app-chart/values-openshift.yaml` | OpenShift-specific configuration |
| `ospo-app-chart/templates/` | Helm templates |

### Environment-Specific Configuration

Edit `ospo-app-chart/values-openshift.yaml` to customize:

```yaml
# Application settings
app:
  baseUrl: "https://your-app-domain.com"

# Keycloak settings
keycloak:
  publicUrl: "https://your-keycloak-domain.com/auth"

# OpenShift settings
openshift:
  domain: "your-openshift-cluster.com"
```

## 🧪 Testing

The deployment includes comprehensive automated testing:

```bash
# Run all tests
./test-deployment.sh prod-rh-events-org ospo-events

# Tests include:
# ✅ Deployment readiness
# ✅ Service endpoints
# ✅ Database connectivity
# ✅ Keycloak configuration
# ✅ OpenID Connect setup
# ✅ Route accessibility
```

## 🔍 Troubleshooting

### Common Commands

```bash
# Check deployment status
oc get pods -l app.kubernetes.io/instance=ospo-events

# Check logs
oc logs -l app.kubernetes.io/instance=ospo-events -f

# Check routes
oc get routes -l app.kubernetes.io/instance=ospo-events

# Check events
oc get events --sort-by=.metadata.creationTimestamp

# Test health endpoints
curl https://$(oc get route ospo-events-ospo-app -o jsonpath='{.spec.host}')/api/health
```

### Clean Deployment

To start fresh:

```bash
# Complete cleanup
helm uninstall ospo-events -n prod-rh-events-org
kubectl delete namespace prod-rh-events-org

# Redeploy
./deploy-openshift.sh
```

## 📚 Additional Resources

- **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - Comprehensive deployment guide
- **[values-openshift.yaml](./ospo-app-chart/values-openshift.yaml)** - Configuration reference
- **[test-deployment.sh](./test-deployment.sh)** - Testing script source

## 🔄 Migration from Old Deployment

If you have an existing deployment using the old process:

1. **Backup your data** (if needed)
2. **Clean up existing resources**: `./cleanup-existing.sh`
3. **Deploy using new process**: `./deploy-openshift.sh`

## 🎉 Benefits of New Process

- **🚀 Faster deployment** - Single command execution
- **🔒 Secure by default** - Proper authentication configuration
- **🛠️ Self-healing** - Automatic setup and configuration
- **📊 Comprehensive testing** - Built-in validation
- **📖 Better documentation** - Clear deployment steps
- **🔄 Repeatable** - Works the same way every time

---

**Need help?** Check the [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed instructions and troubleshooting.