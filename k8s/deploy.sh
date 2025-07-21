#!/bin/bash

# OSPO Events Manager - Professional Deployment Script
# Usage: ./deploy.sh <environment>
# Example: ./deploy.sh dev
#          ./deploy.sh prod

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "FAIL" ]; then
        echo -e "${RED}❌ $2${NC}"
        exit 1
    elif [ "$1" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    else
        echo -e "${BLUE}ℹ️  $2${NC}"
    fi
}

# Check if environment parameter is provided
if [ $# -eq 0 ]; then
    print_status "FAIL" "Usage: $0 <environment>"
    echo "Available environments: dev, prod"
    exit 1
fi

ENVIRONMENT=$1
ENV_FILE="env.${ENVIRONMENT}"

# Validate environment
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    print_status "FAIL" "Invalid environment: $ENVIRONMENT. Use 'dev' or 'prod'"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    print_status "FAIL" "Environment file not found: $ENV_FILE"
    exit 1
fi

print_status "INFO" "OSPO Events Manager - Professional Deployment"
print_status "INFO" "Environment: $ENVIRONMENT"
print_status "INFO" "Config file: $ENV_FILE"
echo ""

# Load environment variables
print_status "INFO" "Loading environment configuration..."
export $(grep -v '^#' "$ENV_FILE" | xargs)
print_status "SUCCESS" "Configuration loaded for $ENVIRONMENT environment"

# Check prerequisites
print_status "INFO" "Checking prerequisites..."

# Check if oc is installed and logged in
if ! command -v oc &> /dev/null; then
    print_status "FAIL" "oc CLI not found. Please install OpenShift CLI."
fi

if ! oc whoami &>/dev/null; then
    print_status "FAIL" "Not logged into OpenShift. Please run 'oc login' first."
fi

print_status "SUCCESS" "OpenShift login verified (user: $(oc whoami))"

# Check if envsubst is available
if ! command -v envsubst &> /dev/null; then
    print_status "FAIL" "envsubst not found. Please install gettext package."
fi

print_status "SUCCESS" "All prerequisites met"

# Create or switch to namespace
print_status "INFO" "Setting up namespace: $NAMESPACE"
if ! oc get namespace "$NAMESPACE" &> /dev/null; then
    print_status "INFO" "Creating namespace: $NAMESPACE"
    oc new-project "$NAMESPACE" || oc create namespace "$NAMESPACE"
else
    print_status "INFO" "Switching to existing namespace: $NAMESPACE"
    oc project "$NAMESPACE"
fi

# Function to apply template with environment substitution
apply_template() {
    local template_file=$1
    local description=$2

    print_status "INFO" "Deploying $description..."

    if [ ! -f "templates/$template_file" ]; then
        print_status "FAIL" "Template not found: templates/$template_file"
        return 1
    fi

    # Use envsubst to substitute environment variables and apply
    envsubst < "templates/$template_file" | oc apply -f -

    print_status "SUCCESS" "$description deployed"
}

# Build application image if in dev environment
if [ "$ENVIRONMENT" = "dev" ]; then
    print_status "INFO" "Building application image..."

    # Check if build config exists
    if ! oc get buildconfig "$APP_NAME" &> /dev/null; then
        print_status "INFO" "Creating build configuration..."
        oc new-build --name="$APP_NAME" --binary --strategy=docker --to="$APP_NAME:latest"
    fi

    # Build the image
    print_status "INFO" "Starting build process..."
    oc start-build "$APP_NAME" --from-dir=.. --follow

    print_status "SUCCESS" "Application image built successfully"
fi

# Deploy components in order
print_status "INFO" "Starting deployment sequence..."

# 1. Deploy secrets and config
apply_template "secrets.yaml" "Secrets"
apply_template "configmap.yaml" "ConfigMap"

# 2. Deploy PostgreSQL first (others depend on it)
apply_template "postgres.yaml" "PostgreSQL"

# Wait for PostgreSQL to be ready
print_status "INFO" "Waiting for PostgreSQL to be ready..."
oc wait --for=condition=available --timeout=300s deployment/postgres
print_status "SUCCESS" "PostgreSQL is ready"

# 3. Deploy MinIO
apply_template "minio.yaml" "MinIO"

# Wait for MinIO to be ready
print_status "INFO" "Waiting for MinIO to be ready..."
oc wait --for=condition=available --timeout=180s deployment/minio
print_status "SUCCESS" "MinIO is ready"

# 4. Apply Keycloak realm configuration
print_status "INFO" "Applying Keycloak realm configuration..."
oc apply -f keycloak-realm-config.yaml
print_status "SUCCESS" "Keycloak realm configuration applied"

# 5. Deploy Keycloak
apply_template "keycloak.yaml" "Keycloak"

# Wait for Keycloak to be ready
print_status "INFO" "Waiting for Keycloak to be ready..."
oc wait --for=condition=available --timeout=300s deployment/keycloak
print_status "SUCCESS" "Keycloak is ready"

# 6. Deploy application
apply_template "application.yaml" "Application"

# Wait for application to be ready
print_status "INFO" "Waiting for application to be ready..."
oc wait --for=condition=available --timeout=300s deployment/ospo-app
print_status "SUCCESS" "Application is ready"

# 7. Create routes
apply_template "routes.yaml" "Routes"

# Get deployment status
print_status "INFO" "Deployment Status:"
echo ""
oc get pods -l environment="$ENVIRONMENT"
echo ""

# Get route URLs
print_status "INFO" "Access URLs:"
APP_URL=$(oc get route ospo-app -o jsonpath='{.spec.host}' 2>/dev/null || echo "Not available")
KEYCLOAK_URL=$(oc get route keycloak -o jsonpath='{.spec.host}' 2>/dev/null || echo "Not available")
MINIO_URL=$(oc get route minio-console -o jsonpath='{.spec.host}' 2>/dev/null || echo "Not available")

echo "🌐 Application: https://$APP_URL"
echo "🔐 Keycloak: https://$KEYCLOAK_URL"
echo "📦 MinIO Console: https://$MINIO_URL"
echo ""

print_status "SUCCESS" "Deployment completed successfully!"
print_status "INFO" "Environment: $ENVIRONMENT"
print_status "INFO" "Namespace: $NAMESPACE"

# Show next steps
echo ""
print_status "INFO" "Next Steps:"
echo "1. Verify all pods are running: oc get pods"
echo "2. Check application logs: oc logs -l app=ospo-app"
echo "3. Access the application at: https://$APP_URL"

if [ "$ENVIRONMENT" = "dev" ]; then
    echo "4. Import CSV data if needed: oc apply -f csv-import-job.yaml"
fi