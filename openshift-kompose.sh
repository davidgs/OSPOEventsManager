#!/bin/bash
# Alternative OpenShift Deployment using Kompose

set -e

echo "🚀 Converting Docker Compose to OpenShift manifests..."

# Check if kompose is installed
if ! command -v kompose &> /dev/null; then
    echo "📦 Installing kompose..."
    curl -L https://github.com/kubernetes/kompose/releases/download/v1.30.0/kompose-linux-amd64 -o kompose
    chmod +x kompose
    sudo mv kompose /usr/local/bin/
fi

# Convert docker-compose.yml to OpenShift manifests
echo "🔄 Converting docker-compose.yml to OpenShift manifests..."
kompose convert --provider openshift --out openshift-manifests/

# Create project
PROJECT_NAME="ospo-events-manager"
echo "📦 Creating OpenShift project: $PROJECT_NAME"
oc new-project $PROJECT_NAME || oc project $PROJECT_NAME

# Apply all manifests
echo "🚀 Applying OpenShift manifests..."
oc apply -f openshift-manifests/

# Create route for nginx service
echo "🌍 Creating external route..."
oc expose service nginx --name=ospo-app-route

# Wait for deployments
echo "⏳ Waiting for deployments to complete..."
oc rollout status dc/postgres --timeout=300s
oc rollout status dc/keycloak --timeout=300s
oc rollout status dc/ospo-app --timeout=300s
oc rollout status dc/nginx --timeout=300s

# Get route URL
ROUTE_URL=$(oc get route ospo-app-route -o jsonpath='{.spec.host}')

echo "✅ Deployment completed successfully!"
echo "🔗 Access your application at: http://$ROUTE_URL"