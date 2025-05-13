#!/bin/bash

# Exit on error
set -e

echo "Building Docker image..."
docker build -t ospo-events-app:latest -f k8s/Dockerfile .

echo "Deploying to Docker Desktop Kubernetes..."
kubectl apply -f k8s/docker-desktop-deployment.yaml

echo "Deployment complete! Application should be available at:"
echo "http://localhost:7777"

echo ""
echo "To check pod status:"
echo "kubectl get pods"
echo ""
echo "To see pod logs:"
echo "kubectl logs -l app=ospo-app"
echo ""
echo "To delete deployment:"
echo "kubectl delete -f k8s/docker-desktop-deployment.yaml"