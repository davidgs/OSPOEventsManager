# OSPO Events App Kubernetes Deployment

This directory contains a simplified Kubernetes deployment configuration for the OSPO Events application. The deployment consists of four main components:

1. A PostgreSQL database for data storage
2. A Keycloak server for authentication
3. A MinIO server for file storage
4. The OSPO Events application itself

## Prerequisites

- Kubernetes cluster (local or remote)
- Docker installed
- kubectl configured to access your Kubernetes cluster

## Deployment

To deploy the application, run the following command:

```bash
# If you have previous deployments to clean up first
chmod +x k8s/clean-up.sh
./k8s/clean-up.sh

# Then deploy the application
chmod +x k8s/build-and-deploy.sh
./k8s/build-and-deploy.sh
```

This script will:
1. Build the application Docker image
2. Deploy all necessary Kubernetes resources
3. Wait for all deployments to be ready

## Accessing the Application

To access the deployed services, use the port-forwarding script:

```bash
chmod +x k8s/ports-forward.sh
./k8s/ports-forward.sh
```

This will make the following services available locally:

- **Main Application**: http://localhost:7777
- **Keycloak Admin UI**: http://localhost:8080/admin (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Components

### PostgreSQL

- Database server for storing application data
- Credentials: 
  - Username: ospo_user
  - Password: ospo_password123
  - Database: ospo_events

### Keycloak

- Authentication server (running in production mode)
- Admin credentials:
  - Username: admin
  - Password: admin
- Realm: ospo-events
- Client: ospo-events-app
- Client Secret: client-secret-123

### MinIO

- Object storage server for file uploads
- Credentials:
  - Access key: minioadmin
  - Secret key: minioadmin
- Bucket: uploads

### OSPO Events Application

- Main application container
- Connected to all other services
- Exposed via LoadBalancer on port 7777

## Configuration Details

All components are configured to communicate within the Kubernetes cluster using service names as hostnames:

- PostgreSQL: postgres:5432
- Keycloak: keycloak:8080
- MinIO: minio:9000

The application container is configured with all necessary environment variables to connect to these services.

## Initialization Jobs

The deployment includes initialization jobs that run automatically:

1. **MinIO Setup**: Creates the 'uploads' bucket and configures permissions
2. **Keycloak Setup**: Creates the 'ospo-events' realm and configures the client

These jobs ensure all components are properly configured and ready to use.