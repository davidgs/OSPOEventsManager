# K8s Directory - OpenShift Deployment Manifests

This directory contains all the Kubernetes/OpenShift YAML manifests required for deploying the OSPO Events Manager application. These files are used by the `deploy.sh` script to create and manage the application infrastructure.

## Directory Structure

```
k8s/
├── README.md                    # This file
├── app-buildconfig.yaml         # Build configuration for the application
├── app-deployment.yaml          # Application deployment and service
├── app-imagestream.yaml         # OpenShift ImageStream for the application
├── keycloak-deployment.yaml     # Keycloak authentication service
├── minio-deployment.yaml        # MinIO object storage for file uploads
├── ollama-deployment.yaml       # Ollama AI service with GPU support
├── postgres-deployment.yaml     # PostgreSQL database
└── routes.yaml                  # OpenShift routes for external access
```

## File Descriptions

### Core Application Files

#### `app-buildconfig.yaml`
- **Purpose**: Defines the OpenShift BuildConfig for building the application Docker image
- **Features**:
  - Source-to-image (S2I) build strategy
  - Node.js 20 runtime
  - Environment variable injection during build
  - Docker Hub authentication for base images
- **Used by**: `deploy_app()` function in deploy.sh

#### `app-imagestream.yaml`
- **Purpose**: Defines the OpenShift ImageStream for the application image
- **Features**:
  - Tracks built application images
  - Supports image versioning and tagging
- **Used by**: `deploy_app()` function in deploy.sh

#### `app-deployment.yaml`
- **Purpose**: Defines the main application deployment, service, and PVC
- **Features**:
  - Node.js application container
  - Environment variable configuration
  - Persistent volume for uploads (`/app/uploads`)
  - Health checks and resource limits
  - ClusterIP service for internal communication
- **Used by**: `deploy_app()` function in deploy.sh

### Database Files

#### `postgres-deployment.yaml`
- **Purpose**: PostgreSQL database deployment for application and Keycloak data
- **Features**:
  - PostgreSQL 16 container
  - Two separate databases: events and keycloak
  - Persistent volume for data storage
  - Database initialization scripts
  - Resource limits and health checks
- **Used by**: `deploy_postgres()` function in deploy.sh

### Authentication Files

#### `keycloak-deployment.yaml`
- **Purpose**: Keycloak authentication service deployment
- **Features**:
  - Keycloak container with PostgreSQL backend
  - Realm and client configuration via ConfigMaps
  - Health checks and startup probes
  - Resource limits and scaling
- **Used by**: `deploy_keycloak()` function in deploy.sh

### Storage Files

#### `minio-deployment.yaml`
- **Purpose**: MinIO object storage for file uploads and attachments
- **Features**:
  - MinIO S3-compatible storage
  - Persistent volume for file storage
  - Default credentials configuration
  - Health checks and resource limits
- **Used by**: `deploy_minio()` function in deploy.sh

### AI Service Files

#### `ollama-deployment.yaml`
- **Purpose**: Ollama AI service for natural language SQL querying
- **Features**:
  - Ollama container with GPU support
  - NVIDIA GPU resource requests (`nvidia.com/gpu: "1"`)
  - Node selector for GPU-enabled nodes (`hardware: "nvidia-gpu"`)
  - Tolerations for GPU node scheduling
  - Persistent storage for AI models
  - External route for API access
- **Used by**: `deploy_ai()` function in deploy.sh

### Networking Files

#### `routes.yaml`
- **Purpose**: OpenShift routes for external access to services
- **Features**:
  - Application route with TLS termination
  - Keycloak authentication route
  - Edge TLS termination with redirect
- **Used by**: `create_routes()` function in deploy.sh

## Deployment Process

These YAML files are processed by the `deploy.sh` script using the following workflow:

1. **Environment Variable Substitution**: Files are processed with `envsubst` to inject environment-specific values
2. **Sequential Application**: Files are applied in dependency order (database → storage → auth → app → AI)
3. **Validation**: Each deployment is validated for successful startup
4. **Health Checks**: Services are verified to be running and healthy

## Environment Variables

The following environment variables are used by `envsubst` for template substitution:

- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - Main application database name
- `KEYCLOAK_DB_NAME` - Keycloak database name
- `KEYCLOAK_ADMIN_USER` - Keycloak admin username
- `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin password
- `KEYCLOAK_CLIENT_SECRET` - Keycloak client secret
- `MINIO_ROOT_USER` - MinIO admin username
- `MINIO_ROOT_PASSWORD` - MinIO admin password
- `NAMESPACE` - OpenShift project namespace
- `APP_URL` - Application external URL
- `KEYCLOAK_URL` - Keycloak external URL

## Resource Requirements

### CPU and Memory
- **Application**: 512m CPU, 1Gi memory (requests), 1 CPU, 2Gi memory (limits)
- **PostgreSQL**: 500m CPU, 1Gi memory (requests), 1 CPU, 2Gi memory (limits)
- **Keycloak**: 500m CPU, 1Gi memory (requests), 1 CPU, 2Gi memory (limits)
- **MinIO**: 250m CPU, 512Mi memory (requests), 500m CPU, 1Gi memory (limits)
- **Ollama**: 2 CPU, 8Gi memory (requests), 4 CPU, 16Gi memory (limits)

### Storage
- **PostgreSQL**: 10Gi persistent volume
- **MinIO**: 10Gi persistent volume
- **Application**: 5Gi persistent volume for uploads
- **Ollama**: EmptyDir volume for AI models (temporary)

### GPU Resources (Ollama)
- **NVIDIA GPU**: 1 GPU unit required
- **Node Selector**: `hardware: "nvidia-gpu"`
- **Tolerations**: For GPU node scheduling

## Security Considerations

- All services use ClusterIP for internal communication
- External access only through OpenShift routes
- TLS termination at the router level
- Persistent volumes for data retention
- Resource limits to prevent resource exhaustion
- Health checks for service reliability

## Maintenance

### Updating Deployments
1. Modify the appropriate YAML file
2. Run `./deploy.sh --dev` or `./deploy.sh --prod` to apply changes
3. Use specific deployment functions for targeted updates:
   - `./deploy.sh --dev --app-only` for application updates
   - `./deploy.sh --dev --keycloak-only` for Keycloak updates
   - `./deploy.sh --dev --ai-only` for AI service updates

### Backup and Restore
- Use `./deploy.sh --backup` to backup all data
- Use `./deploy.sh --restore -f /path/to/backup` to restore data
- Use `./deploy.sh --delete` to delete pods while preserving data
- Use `./deploy.sh --destroy` to completely destroy all data (CATASTROPHIC)

## Troubleshooting

### Common Issues
1. **Resource Constraints**: Check cluster resource availability
2. **GPU Scheduling**: Ensure GPU nodes are available for Ollama
3. **Storage Issues**: Verify PVC creation and mounting
4. **Network Connectivity**: Check routes and service endpoints

### Debugging Commands
```bash
# Check pod status
oc get pods

# Check service endpoints
oc get svc

# Check routes
oc get routes

# Check persistent volumes
oc get pvc

# View pod logs
oc logs <pod-name>

# Check resource usage
oc adm top pods
```

## File History

This directory was standardized from inline YAML in `deploy.sh` to improve:
- **Maintainability**: Easier to modify and version control
- **Readability**: Clear separation of concerns
- **Reusability**: Files can be applied independently
- **Documentation**: Each file has a specific purpose and can be documented

For deployment instructions, see the main [README.md](../README.md) and [deploy.sh](../deploy.sh) script.
