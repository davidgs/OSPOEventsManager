#!/bin/bash
set -e

# Script to deploy the OSPO Events App to a Kubernetes cluster

# Check if namespace is provided as an argument
NAMESPACE="default"
if [ "$1" != "" ]; then
  NAMESPACE="$1"
  echo "Using namespace: $NAMESPACE"
fi

# Ensure namespace exists
kubectl get namespace "$NAMESPACE" &> /dev/null || kubectl create namespace "$NAMESPACE"

# Apply Kubernetes resources
echo "Deploying OSPO Events App to Kubernetes..."
helm upgrade --install ospo-app ./k8s/charts/ospo-app --namespace "$NAMESPACE"

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
kubectl rollout status deployment/ospo-app-app -n "$NAMESPACE"

# Get service information
echo "Deployment completed successfully"
echo "Service details:"
kubectl get service -n "$NAMESPACE" | grep ospo-app

# Check if an ingress was created
if kubectl get ingress -n "$NAMESPACE" | grep -q ospo-app; then
  echo "Ingress details:"
  kubectl get ingress -n "$NAMESPACE" | grep ospo-app
  
  # Get ingress hostname if available
  HOSTNAME=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[?(@.metadata.name=="ospo-app-ingress")].spec.rules[0].host}')
  if [ "$HOSTNAME" != "" ]; then
    echo "Application will be available at: http://$HOSTNAME"
  fi
else
  # Get service port
  PORT=$(kubectl get service ospo-app-service -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].nodePort}')
  if [ "$PORT" != "" ]; then
    echo "Application will be available at NodePort: $PORT"
  fi
fi

echo "Deployment process completed successfully"