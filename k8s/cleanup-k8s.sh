#!/bin/bash

echo "Cleaning up existing Kubernetes resources..."

# Delete the loadbalancer service
kubectl delete service/ospo-app-lb --ignore-not-found

# Delete the main service
kubectl delete service/ospo-app --ignore-not-found

# Delete the deployment
kubectl delete deployment/ospo-app --ignore-not-found

echo "Cleanup complete!"