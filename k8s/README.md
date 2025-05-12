# OSPO Event Management System - Kubernetes Deployment

This directory contains Kubernetes deployment configurations for the OSPO Event Management application.

## Architecture

The application is deployed as a set of microservices on Kubernetes:

1. **App Server** - Node.js Express application serving the API and static content
2. **PostgreSQL Database** - Persistent storage for application data
3. **Keycloak** - Authentication server for user management
4. **MinIO** - Object storage for file uploads (abstracts, presentations, headshots, etc.)
5. **Ingress** - Load balancer for routing traffic to the appropriate services

## Deployment Options

### Using Helm

The recommended deployment method is to use the Helm chart provided in this repository.

```bash
# Add the repository to your GitHub credentials (if private repo)
helm repo add ospo-app https://github.com/your-org/ospo-app.git

# Install the chart
helm install ospo-app ./k8s/charts/ospo-app \
  --set repository.url=https://github.com/your-org/ospo-app.git \
  --set repository.branch=main \
  --set ingress.hosts[0].host=ospo-app.example.com
```

### Configuration

You can customize the deployment by providing your own values.yaml file:

```bash
helm install ospo-app ./k8s/charts/ospo-app -f my-values.yaml
```

## Prerequisites

- Kubernetes cluster v1.19+
- Helm v3.2.0+
- PV provisioner support in the underlying infrastructure (for persistent storage)
- Ingress controller (like NGINX) for the load balancer

## Architecture Overview

```
                                  ┌─────────────────┐
                                  │                 │
                                  │  Load Balancer  │
                                  │    (Ingress)    │
                                  │                 │
                                  └───────┬─────────┘
                                          │
                                          ▼
                 ┌─────────────────┬──────────────────┬─────────────────┐
                 │                 │                  │                 │
                 ▼                 ▼                  ▼                 ▼
        ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │                 │ │              │ │              │ │              │
        │   App Server    │ │   Keycloak   │ │    MinIO     │ │ Other Pods   │
        │     (Pod)       │ │    (Pod)     │ │    (Pod)     │ │              │
        │                 │ │              │ │              │ │              │
        └────────┬────────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
                 │                 │                 │
                 │                 │                 │
                 ▼                 │                 │
        ┌─────────────────┐       │                 │
        │                 │       │                 │
        │   PostgreSQL    │◄──────┘                 │
        │     (Pod)       │                         │
        │                 │                         │
        └─────────────────┘                         │
                                                   │
        ┌─────────────────┐                        │
        │                 │                        │
        │ Shared Storage  │◄───────────────────────┘
        │     (PVC)       │
        │                 │
        └─────────────────┘
```

## Scaling Considerations

- The app server can be horizontally scaled by increasing the `replicaCount` value
- PostgreSQL could be set up with replication for high availability
- For production use, consider using managed services for PostgreSQL and object storage

## Monitoring

The application includes a `/api/health` endpoint for Kubernetes health checks.

## Security

- All sensitive credentials are stored in Kubernetes Secrets
- TLS can be enabled via the Ingress configuration
- Keycloak provides robust authentication and authorization