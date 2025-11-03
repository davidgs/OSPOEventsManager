# KIND Cluster Configuration

This guide covers local development using KIND (Kubernetes in Docker) with the standardized `deploy.sh` script.

## Prerequisites

Install required tools:
```bash
brew install podman kind kubectl node
```

Initialize and start Podman:
```bash
podman machine init
podman machine start

# Verify Podman is running
podman machine list
```

## Quick Setup

```bash
# Configure local environment
./configure.sh --local

# Deploy services to KIND cluster (PostgreSQL, Keycloak, MinIO)
./deploy.sh --local

# Initialize database
npm run db:push:local

# Run application locally (NOT in cluster - enables hot reload)
npm run dev:local
```

**Architecture:** Services run in KIND cluster, application runs locally on your machine for hot reload.

Application available at `http://localhost:4576`

## Deployment Commands

### Deploy Services

```bash
# Deploy all services (PostgreSQL, Keycloak, MinIO)
./deploy.sh --local

# Deploy individual services
./deploy.sh --local --postgres
./deploy.sh --local --keycloak
./deploy.sh --local --minio

# Deploy specific combinations
./deploy.sh --local --postgres --keycloak
```

### Manage Cluster

```bash
# Check if cluster exists
kind get clusters

# Check cluster status
kubectl get pods -n ospo-local

# Delete cluster (removes all data)
./deploy.sh --delete-local

# Or manually delete cluster
kind delete cluster --name ospo-local

# Recreate cluster and services
./deploy.sh --local
```

## Cluster Configuration

- **Cluster Name**: `ospo-local`
- **Namespace**: `ospo-local`
- **Runtime**: Podman
- **Port Mapping**: NodePort (30432→5432, 30080→8080, 30900→9000, 30901→9001)

## Services

All services are deployed in the `ospo-local` namespace and accessible via localhost.

### PostgreSQL
- **Port**: 5432
- **Connection**: `postgres://ospo_user:ospo_password@localhost:5432/ospo_events`
- **Databases**: `ospo_events`, `keycloak`
- **Storage**: 5Gi PVC

### Keycloak
- **Port**: 8080
- **URL**: http://localhost:8080/auth
- **Admin Console**: http://localhost:8080/auth/admin
- **Credentials**: admin/admin
- **Realm**: ospo-events

### MinIO
- **API Port**: 9000
- **Console Port**: 9001
- **Console URL**: http://localhost:9001
- **Credentials**: minioadmin/minioadmin
- **Storage**: 5Gi PVC

### Check Service Status

```bash
# View all pods
kubectl get pods -n ospo-local

# View all services
kubectl get svc -n ospo-local

# View logs
kubectl logs -n ospo-local -l app=postgres --tail=50
kubectl logs -n ospo-local -l app=keycloak --tail=50
kubectl logs -n ospo-local -l app=minio --tail=50
```

## Troubleshooting

### Cluster Won't Start

```bash
# Check Podman status
podman machine list
podman machine start

# If cluster exists but not responding
./deploy.sh --delete-local

# Recreate cluster
./deploy.sh --local
```

### Pods Not Ready

```bash
# Check pod status
kubectl get pods -n ospo-local

# Get detailed pod information
kubectl describe pod -n ospo-local <pod-name>

# View logs
kubectl logs -n ospo-local -l app=postgres
kubectl logs -n ospo-local -l app=keycloak
kubectl logs -n ospo-local -l app=minio

# Restart a deployment
kubectl rollout restart deployment/postgres -n ospo-local
```

### Services Not Accessible

```bash
# Verify services and NodePorts
kubectl get svc -n ospo-local

# Check port usage on host
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Keycloak
lsof -i :9000  # MinIO API
lsof -i :9001  # MinIO Console

# Test connectivity
psql "postgres://ospo_user:ospo_password@localhost:5432/ospo_events" -c "SELECT 1"
curl http://localhost:8080/auth
curl http://localhost:9001
```

### Application Can't Connect

```bash
# Verify .env.local configuration
cat .env.local | grep DATABASE_URL
cat .env.local | grep KEYCLOAK_URL

# Ensure services are running
kubectl get pods -n ospo-local

# Check if ports are accessible
nc -zv localhost 5432
nc -zv localhost 8080

# Redeploy if needed
./deploy.sh --local --postgres --keycloak
```

### Complete Reset

```bash
# Option 1: Using deploy script (recommended)
./deploy.sh --delete-local

# Then recreate
./deploy.sh --local
npm run db:push:local

# Option 2: Manual reset
kind delete cluster --name ospo-local
podman machine restart
./configure.sh --local
./deploy.sh --local
npm run db:push:local
```

## Resource Usage

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| PostgreSQL | 100m | 256Mi | 5Gi |
| Keycloak | 200m | 512Mi | - |
| MinIO | 100m | 256Mi | 5Gi |

## Useful Commands

```bash
# Cluster info
kubectl cluster-info --context kind-ospo-local

# All resources
kubectl get all -n ospo-local

# Events
kubectl get events -n ospo-local --sort-by='.lastTimestamp'

# Execute in pod
kubectl exec -it -n ospo-local deployment/postgres -- bash

# Port-forward manually
kubectl port-forward -n ospo-local pod/<pod-name> 5432:5432

# View detailed logs
kubectl logs -f -n ospo-local deployment/postgres
```

## Updating Services

```bash
# Edit service YAML
vim kind/postgres.yaml

# Apply changes
kubectl apply -f kind/postgres.yaml

# Or redeploy with deploy.sh
./deploy.sh --local --postgres
```

## Database Access

```bash
# Direct psql access
psql "postgres://ospo_user:ospo_password@localhost:5432/ospo_events"

# Via kubectl
kubectl exec -it -n ospo-local deployment/postgres -- psql -U ospo_user -d ospo_events

# Push schema changes
npm run db:push:local

# Generate migrations
npm run db:generate
```

## Keycloak Management

```bash
# Access admin console
open http://localhost:8080/auth/admin

# Export realm
kubectl exec -n ospo-local deployment/keycloak -- \
  /opt/keycloak/bin/kc.sh export --file /tmp/realm.json
kubectl cp ospo-local/keycloak-<pod-id>:/tmp/realm.json ./keycloak-realm-export.json
```

## Files

- `namespace.yaml` - Namespace definition
- `postgres.yaml` - PostgreSQL with init scripts
- `keycloak.yaml` - Keycloak with PostgreSQL backend
- `minio.yaml` - MinIO object storage

## Teardown

When you're done with local development and want to clean up:

```bash
# Delete the local KIND cluster and all data
./deploy.sh --delete-local
```

This will:
- Delete the entire KIND cluster
- Remove all services (PostgreSQL, Keycloak, MinIO)
- Remove all data and persistent volumes
- Free up system resources

**Note:** This is permanent and cannot be undone. You'll need to run `./deploy.sh --local` again to recreate the environment.

## Deployment Architecture

The local KIND deployment uses the same `deploy.sh` script as production deployments, providing:

```
1. ./configure.sh --local     → Creates .env.local
2. ./deploy.sh --local        → Deploys services to KIND
3. npm run db:push:local      → Initializes database schema
4. npm run dev:local          → Runs app locally with hot reload
```

For production deployments, see main [README.md](../README.md#deployment).
