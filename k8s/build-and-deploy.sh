#!/bin/bash
set -e

# Build the application container image
echo "Building application container image..."
docker build -t ospo-events-app:latest -f k8s/Dockerfile .

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."

# Apply database
kubectl apply -f k8s/postgres-deployment.yaml

# Apply MinIO storage
kubectl apply -f k8s/minio-deployment.yaml

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/minio

# Apply MinIO setup job
kubectl apply -f k8s/minio-setup.yaml

# Apply Keycloak config
kubectl apply -f k8s/keycloak-realm-config.yaml

# Apply Keycloak
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