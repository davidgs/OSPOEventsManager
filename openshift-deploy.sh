#!/bin/bash
# OpenShift Deployment Script for OSPO Events Manager

set -e

echo "🚀 Deploying OSPO Events Manager to OpenShift..."

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    echo "❌ OpenShift CLI (oc) is not installed. Please install it first."
    exit 1
fi

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    echo "❌ Not logged in to OpenShift. Please run: oc login https://your-openshift-cluster.com"
    exit 1
fi

# Create a new project
PROJECT_NAME="ospo-events-manager"
echo "📦 Creating OpenShift project: $PROJECT_NAME"
oc new-project $PROJECT_NAME || oc project $PROJECT_NAME

# Deploy PostgreSQL using OpenShift template
echo "🗄️ Deploying PostgreSQL database..."
oc new-app postgresql-persistent \
  -p DATABASE_SERVICE_NAME=postgres \
  -p POSTGRESQL_USER=ospo_user \
  -p POSTGRESQL_PASSWORD=ospo_password \
  -p POSTGRESQL_DATABASE=ospo_events

# Deploy Keycloak
echo "🔐 Deploying Keycloak..."
oc new-app quay.io/keycloak/keycloak:23.0.6 \
  --name=keycloak \
  -e KC_DB=postgres \
  -e KC_DB_URL=jdbc:postgresql://postgres:5432/ospo_events \
  -e KC_DB_USERNAME=ospo_user \
  -e KC_DB_PASSWORD=ospo_password \
  -e KC_HOSTNAME_STRICT=false \
  -e KC_HOSTNAME_STRICT_HTTPS=false \
  -e KC_HTTP_ENABLED=true \
  -e KC_HTTP_RELATIVE_PATH=/auth \
  -e KC_PROXY=edge \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin123 \
  --command='["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm"]'

# Build and deploy the main application
echo "🏗️ Building and deploying OSPO application..."
oc new-app . --name=ospo-app --strategy=docker

# Deploy nginx proxy
echo "🌐 Deploying nginx proxy..."
oc create configmap nginx-config --from-file=nginx.conf
oc new-app nginx:alpine --name=nginx
oc set volume dc/nginx --add --configmap-name=nginx-config --mount-path=/etc/nginx/nginx.conf --sub-path=nginx.conf

# Create routes for external access
echo "🌍 Creating external routes..."
oc expose service nginx --port=80 --name=ospo-app-route

# Wait for deployments to complete
echo "⏳ Waiting for deployments to complete..."
oc rollout status dc/postgres --timeout=300s
oc rollout status dc/keycloak --timeout=300s
oc rollout status dc/ospo-app --timeout=300s
oc rollout status dc/nginx --timeout=300s

# Get the route URL
ROUTE_URL=$(oc get route ospo-app-route -o jsonpath='{.spec.host}')

echo "✅ Deployment completed successfully!"
echo "🔗 Access your application at: http://$ROUTE_URL"
echo "🔐 Keycloak admin console: http://$ROUTE_URL/auth/admin"
echo "👤 Keycloak admin credentials: admin/admin123"
