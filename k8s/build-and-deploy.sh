#!/bin/bash
set -e

# Build the application container image
echo "Building application container image..."
docker build -t ospo-events-app:latest -f k8s/Dockerfile .

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."

# Apply database
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/postgres

# Apply MinIO storage
kubectl apply -f k8s/minio-deployment.yaml

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/minio

# Apply MinIO setup job
kubectl apply -f k8s/minio-setup.yaml

# Apply Keycloak config
kubectl apply -f k8s/keycloak-realm-config.yaml

# Initialize Keycloak database
kubectl apply -f k8s/keycloak-db-init.yaml

# Wait for Keycloak DB initialization to complete
echo "Waiting for Keycloak database initialization to complete..."
kubectl wait --for=condition=complete --timeout=300s job/keycloak-db-init

# Apply Keycloak build step (required for production mode)
kubectl apply -f k8s/keycloak-build-step.yaml

# Wait for Keycloak build to complete
echo "Waiting for Keycloak build to complete..."
kubectl wait --for=condition=complete --timeout=300s job/keycloak-build

# Apply Keycloak deployment
kubectl apply -f k8s/keycloak-deployment.yaml

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
kubectl wait --for=condition=available --timeout=180s deployment/keycloak

# Apply Keycloak setup job
kubectl apply -f k8s/keycloak-setup.yaml

# Apply application deployment
kubectl apply -f k8s/app-deployment.yaml

# Apply load balancer
kubectl apply -f k8s/load-balancer.yaml

echo "Waiting for all services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres
kubectl wait --for=condition=available --timeout=300s deployment/keycloak
kubectl wait --for=condition=available --timeout=300s deployment/ospo-app

echo "Deployment complete! The application should be accessible at http://localhost:7777"
echo "- Keycloak admin UI: http://localhost:8080/admin (admin/admin)"
echo "- MinIO console: http://localhost:9001 (minioadmin/minioadmin)"