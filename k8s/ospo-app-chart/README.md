# OSPO Events Application Helm Chart

This Helm chart deploys the OSPO Events Application along with its required infrastructure components.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Docker (for building the application image)

## Components

This chart deploys the following components:

1. **OSPO Events Application**: The main web application built with React and Express.js
2. **PostgreSQL**: Database for storing application data
3. **Keycloak**: Authentication server for user management
4. **MinIO**: Object storage for file uploads

## Installation

```bash
# Build the application image
docker build -t ospo-events-app:latest -f k8s/Dockerfile .

# Install with Helm
helm install ospo-app ./k8s/ospo-app-chart
```

## Configuration

### Application Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `app.image.repository` | Application image repository | `ospo-events-app` |
| `app.image.tag` | Application image tag | `latest` |
| `app.image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `app.service.type` | Service type | `ClusterIP` |
| `app.service.port` | Service port | `5000` |
| `app.env.*` | Environment variables for the application | Various settings |

### PostgreSQL Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.image.repository` | PostgreSQL image repository | `postgres` |
| `postgresql.image.tag` | PostgreSQL image tag | `16-alpine` |
| `postgresql.auth.username` | PostgreSQL username | `ospo_user` |
| `postgresql.auth.password` | PostgreSQL password | `ospo_password123` |
| `postgresql.auth.database` | PostgreSQL database name | `ospo_events` |
| `postgresql.persistence.enabled` | Enable persistence | `false` |
| `postgresql.persistence.size` | PVC size | `1Gi` |

### Keycloak Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `keycloak.enabled` | Enable Keycloak | `true` |
| `keycloak.image.repository` | Keycloak image repository | `quay.io/keycloak/keycloak` |
| `keycloak.image.tag` | Keycloak image tag | `23.0.6` |
| `keycloak.admin.username` | Admin username | `admin` |
| `keycloak.admin.password` | Admin password | `admin` |
| `keycloak.realm` | Realm name | `ospo-events` |

### MinIO Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `minio.enabled` | Enable MinIO | `true` |
| `minio.image.repository` | MinIO image repository | `minio/minio` |
| `minio.image.tag` | MinIO image tag | `RELEASE.2024-04-29T01-14-24Z` |
| `minio.auth.rootUser` | MinIO root user | `minioadmin` |
| `minio.auth.rootPassword` | MinIO root password | `minioadmin` |
| `minio.buckets` | Buckets to create | `[{name: uploads, policy: download}]` |

## Production Deployment Recommendations

For production deployment, consider the following:

1. Use persistent volumes for PostgreSQL and MinIO
2. Use stronger passwords and secrets for all components
3. Configure proper resource limits and requests
4. Use a proper domain name and TLS certificates
5. Implement backup and restore procedures
6. Set up monitoring and alerting
7. Configure proper security policies

## Uninstallation

```bash
helm uninstall ospo-app
```