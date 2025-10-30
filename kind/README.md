# KIND Cluster Configuration

## Prerequisites

```bash
brew install podman kind kubectl node
```

Initialize Podman:
```bash
podman machine init
podman machine start
```

## Setup

```bash
# Start cluster with all services
npm run kind:start

# Setup environment
cp ../env.local.template ../.env.local

# Run migrations
npm run db:push

# Start application
npm run dev:local
```

## Management Scripts

### `setup-kind.sh`

```bash
./kind/setup-kind.sh start           # Create cluster and deploy services
./kind/setup-kind.sh stop            # Show stop instructions
./kind/setup-kind.sh restart         # Delete and recreate cluster
./kind/setup-kind.sh delete          # Delete cluster
./kind/setup-kind.sh status          # Show cluster status
./kind/setup-kind.sh logs <service>  # View logs (postgres|keycloak|minio)
./kind/setup-kind.sh restart-services # Restart services without recreating cluster
```

### `port-forward.sh`

Alternative to NodePort if needed:
```bash
./kind/port-forward.sh start    # Start port-forwards
./kind/port-forward.sh stop     # Stop port-forwards
./kind/port-forward.sh status   # Check status
./kind/port-forward.sh logs <service>
```

## Cluster Configuration

- **Cluster Name**: `ospo-local`
- **Namespace**: `ospo-local`
- **Runtime**: Podman
- **Port Mapping**: NodePort (30432→5432, 30080→8080, 30900→9000, 30901→9001)

## Services

### PostgreSQL
- **Image**: postgres:16
- **Port**: 5432
- **Connection**: `postgres://ospo_user:ospo_password@localhost:5432/ospo_events`
- **Storage**: 5Gi PVC
- **Databases**: ospo_events, keycloak

### Keycloak
- **Image**: quay.io/keycloak/keycloak:23.0.6
- **Port**: 8080
- **URL**: http://localhost:8080/auth
- **Admin**: admin/admin
- **Backend**: PostgreSQL

### MinIO
- **Image**: minio/minio:latest
- **Ports**: 9000 (API), 9001 (Console)
- **Console**: http://localhost:9001
- **Credentials**: minioadmin/minioadmin
- **Storage**: 5Gi PVC

## Troubleshooting

### Cluster Won't Start

```bash
# Check Podman
podman machine list
podman machine restart

# Recreate cluster
npm run kind:delete
npm run kind:start
```

### Pods Not Ready

```bash
# Check pod status
kubectl get pods -n ospo-local

# Describe pod
kubectl describe pod -n ospo-local <pod-name>

# View logs
kubectl logs -n ospo-local <pod-name>
# Or use script
npm run kind:logs postgres
```

### Services Not Accessible

```bash
# Verify services
kubectl get svc -n ospo-local

# Check port usage
lsof -i :5432
lsof -i :8080
lsof -i :9000

# Test connectivity
psql "postgres://ospo_user:ospo_password@localhost:5432/ospo_events" -c "SELECT 1"
curl http://localhost:8080/auth
```

### Application Can't Connect

```bash
# Check .env.local
cat ../.env.local

# Ensure correct hosts
grep "HOST" ../.env.local
# Should be localhost, not service names

# Check services are running
npm run kind:status
```

### Reset Everything

```bash
npm run kind:delete
podman machine restart
npm run kind:start
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
# Edit YAML
vim kind/postgres.yaml

# Apply changes
kubectl apply -f kind/postgres.yaml

# Or restart all
./kind/setup-kind.sh restart-services
```

## Database Access

```bash
# Direct psql access
npm run local:db-console

# Or manually
psql "postgres://ospo_user:ospo_password@localhost:5432/ospo_events"

# Via kubectl
kubectl exec -it -n ospo-local deployment/postgres -- psql -U ospo_user -d ospo_events
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
- `setup-kind.sh` - Cluster management script
- `port-forward.sh` - Port forwarding management
