#!/bin/bash
set -e

echo "Cleaning up previous Kubernetes resources..."

# Delete jobs first
echo "Deleting jobs..."
kubectl delete job minio-setup 2>/dev/null || echo "No minio-setup job to delete"
kubectl delete job keycloak-db-init 2>/dev/null || echo "No keycloak-db-init job to delete"
kubectl delete job keycloak-build 2>/dev/null || echo "No keycloak-build job to delete"
kubectl delete job keycloak-setup 2>/dev/null || echo "No keycloak-setup job to delete"

# Delete deployments
echo "Deleting deployments..."
kubectl delete deployment ospo-app 2>/dev/null || echo "No ospo-app deployment to delete"
kubectl delete deployment keycloak 2>/dev/null || echo "No keycloak deployment to delete"
kubectl delete deployment minio 2>/dev/null || echo "No minio deployment to delete"
kubectl delete deployment postgres 2>/dev/null || echo "No postgres deployment to delete"

# Delete services
echo "Deleting services..."
kubectl delete service lb-ospo-app 2>/dev/null || echo "No lb-ospo-app service to delete"
kubectl delete service ospo-app 2>/dev/null || echo "No ospo-app service to delete"
kubectl delete service keycloak 2>/dev/null || echo "No keycloak service to delete"
kubectl delete service minio 2>/dev/null || echo "No minio service to delete"
kubectl delete service postgres 2>/dev/null || echo "No postgres service to delete"

# Delete configmaps
echo "Deleting configmaps..."
kubectl delete configmap keycloak-realm-config 2>/dev/null || echo "No keycloak-realm-config configmap to delete"

echo "Cleanup complete!"