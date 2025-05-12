# OSPO Events App - Kubernetes Deployment Guide

This document provides instructions for deploying the OSPO Events Application to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl command-line tool
- Helm (v3.0+)
- Docker (for building images)
- Docker registry (optional for multi-node clusters)

## Application Architecture

The OSPO Events App deployment consists of:

1. **App Server**: Node.js Express application serving the API and frontend
2. **PostgreSQL**: Database server for persistent storage
3. **Keycloak**: Authentication server
4. **MinIO**: Object storage for file uploads

## Quick Start

For rapid deployment, follow these steps:

### 1. Build the Docker Image

```bash
# From the project root directory
./k8s/docker-build-prod.sh

# If using a registry, specify the registry URL
./k8s/docker-build-prod.sh my-registry.com
```

### 2. Deploy to Kubernetes

```bash
# Deploy to the default namespace
./k8s/deploy.sh

# Or specify a custom namespace
./k8s/deploy.sh ospo-events
```

## Manual Deployment

If you prefer to deploy manually or need more control:

### 1. Build the Application Image

```bash
# Build and tag the image
docker build -t ospo-events-app:latest -f Dockerfile.prod .

# Push to registry if needed
docker push <registry>/ospo-events-app:latest
```

### 2. Update Helm Values

Edit the values file at `k8s/charts/ospo-app/values.yaml` to configure your deployment:

- Update image repository and tag
- Configure database credentials
- Set external access options

### 3. Deploy with Helm

```bash
# Install/upgrade the Helm chart
helm upgrade --install ospo-app ./k8s/charts/ospo-app
```

## Component Configuration

### PostgreSQL

The PostgreSQL database is configured to store all application data. By default, it uses:

- Username: `ospo_user`
- Password: `ospo_password123` (should be changed for production)
- Database name: `ospo_db`

For production, update these values in the Helm chart and consider using Kubernetes secrets.

### Keycloak

Keycloak provides authentication and is preconfigured with:

- Admin user: `admin`
- Generated admin password (view with `kubectl get secret`)
- Client ID: `ospo-events-client`

### MinIO

MinIO provides object storage for file uploads:

- Bucket name: `uploads`
- Access key: `minio`
- Generated secret key (view with `kubectl get secret`)

## Configuration Options

Key configuration options in the Helm values file:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of app server replicas | `1` |
| `appServer.resources` | CPU/Memory resource requests/limits | Requests: 256Mi/250m, Limits: 1Gi/500m |
| `postgresql.persistence.enabled` | Enable persistent volume for PostgreSQL | `false` (for development) |
| `ingress.enabled` | Enable ingress for external access | `true` |
| `ingress.hosts` | Ingress hostnames | `ospo-app.example.com` |

## Accessing the Application

After deployment, the application can be accessed through:

1. **Ingress** (if enabled): At the configured hostname
2. **NodePort** (fallback): On the node IP address at the assigned port
3. **Port-forwarding**: Using `kubectl port-forward service/ospo-app-service 5000:5000`

## Troubleshooting

Common issues and solutions:

1. **Database connection errors**: Check PostgreSQL pod logs and ensure the DATABASE_URL environment variable is correct.
2. **Authentication problems**: Verify Keycloak is running and properly configured.
3. **File upload issues**: Check MinIO pod status and credentials.

For pod-specific troubleshooting:

```bash
# Check pod status
kubectl get pods

# View app logs
kubectl logs deployment/ospo-app-app

# Shell into a container
kubectl exec -it deployment/ospo-app-app -- /bin/sh
```

## Data Persistence

For production deployments, enable persistence for all components:

```yaml
postgresql:
  persistence:
    enabled: true
    size: 10Gi

keycloak:
  persistence:
    enabled: true
    size: 5Gi

minio:
  persistence:
    enabled: true
    size: 20Gi
```

## Security Considerations

For production deployments:

1. Replace default credentials with secure passwords
2. Enable TLS for ingress
3. Configure network policies to restrict pod-to-pod communication
4. Use proper Kubernetes RBAC controls