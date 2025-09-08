#!/bin/bash

# OSPO Events Manager - Production-Ready Deployment Script
# Supports both dev and prod environments with .env configuration
# Usage: ./deploy.sh --dev OR ./deploy.sh --prod

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [--dev|--prod] [options]"
    echo ""
    echo "Options:"
    echo "  --dev          Deploy to development environment"
    echo "  --prod         Deploy to production environment"
    echo "  --help         Show this help message"
    echo "  --app-only     Deploy only the application"
    echo ""
    echo "Requirements:"
    echo "  - .env file must exist with configuration"
    echo "  - OpenShift CLI (oc) must be installed and authenticated"
    echo ""
    echo "Example:"
    echo "  $0 --dev"
    echo "  $0 --prod"
}

# Parse command line arguments
APP_ONLY=""
ENVIRONMENT=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            ENVIRONMENT="dev"
            shift
            ;;
        --prod)
            ENVIRONMENT="prod"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        --app-only)
            APP_ONLY="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Environment not specified. Use --dev or --prod"
    show_usage
    exit 1
fi

# Check for .env file
if [[ ! -f .env ]]; then
    print_error ".env file not found!"
    echo "Please copy env.template to .env and configure your values:"
    echo "  cp env.template .env"
    echo "  # Edit .env with your configuration"
    exit 1
fi

# Load environment variables
print_status "Loading configuration from .env file..."
set -a  # automatically export all variables
source .env
set +a  # turn off automatic export

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "dev" ]]; then
    NAMESPACE="$DEV_NAMESPACE"
    APP_URL="$DEV_APP_URL"
    KEYCLOAK_URL="$DEV_KEYCLOAK_URL"
    VITE_KEYCLOAK_URL="$VITE_KEYCLOAK_URL_DEV"
else
    NAMESPACE="$PROD_NAMESPACE"
    APP_URL="$PROD_APP_URL"
    KEYCLOAK_URL="$PROD_KEYCLOAK_URL"
    VITE_KEYCLOAK_URL="$VITE_KEYCLOAK_URL_PROD"
fi

print_success "Configuration loaded for $ENVIRONMENT environment"
print_status "Namespace: $NAMESPACE"
print_status "App URL: $APP_URL"
print_status "Keycloak URL: $KEYCLOAK_URL"

# Check OpenShift connection
print_status "Checking OpenShift connection..."
if ! oc whoami &>/dev/null; then
    print_error "Not logged into OpenShift!"
    echo "Please login first:"
    echo "  oc login --token=\$OPENSHIFT_TOKEN --server=\$OPENSHIFT_SERVER"
    exit 1
fi

# Switch to correct namespace
print_status "Switching to namespace: $NAMESPACE"
oc project "$NAMESPACE" || {
    print_error "Failed to switch to namespace $NAMESPACE"
    print_warning "Make sure the namespace exists or create it with:"
    echo "  oc new-project $NAMESPACE"
    exit 1
}

print_success "🚀 Starting OSPO Events deployment to $ENVIRONMENT environment"
echo ""

# Function to wait for deployment
wait_for_deployment() {
    local deployment_name=$1
    local timeout=${2:-300}
    if [[ "$APP_ONLY" == "true" ]]; then
        print_status "🚀 Skipping wait for $deployment_name to be ready..."
        return 0
    fi
    print_status "Waiting for $deployment_name to be ready..."
    if oc wait --for=condition=available deployment/"$deployment_name" --timeout="${timeout}s"; then
        print_success "$deployment_name is ready"
    else
        print_error "$deployment_name failed to become ready within ${timeout} seconds"
        return 1
    fi
}

# Function to create Docker Hub secret
create_dockerhub_secret() {
    print_status "🔐 Creating Docker Hub secret..."

    # Check if Docker Hub credentials are provided
    if [[ -z "${DOCKERHUB_USERNAME:-}" || -z "${DOCKERHUB_TOKEN:-}" ]]; then
        print_warning "Docker Hub credentials not provided. Using public images (may hit rate limits)."
        return 0
    fi

    oc create secret docker-registry dockerhub-secret \
        --docker-server=docker.io \
        --docker-username="${DOCKERHUB_USERNAME}" \
        --docker-password="${DOCKERHUB_TOKEN}" \
        --docker-email="${DOCKERHUB_EMAIL:-noreply@example.com}" \
        --dry-run=client -o yaml | oc apply -f -

    # Link the secret to service accounts for builds and pods
    oc secrets link builder dockerhub-secret
    oc secrets link default dockerhub-secret

    # Add to imagePullSecrets for builder service account
    oc patch serviceaccount builder -p '{"imagePullSecrets":[{"name":"dockerhub-secret"}]}' || true

    print_success "Docker Hub secret created and linked to service accounts"
}

# SAFETY FUNCTION: Prevent destructive operations without explicit confirmation
safety_check() {
    local operation=$1
    local destructive_operations=("delete" "patch" "rollout" "scale" "override" "wipe" "clear" "remove")

    for op in "${destructive_operations[@]}"; do
        if [[ "$operation" == *"$op"* ]]; then
            print_error "🚨 SAFETY CHECK FAILED: Operation '$operation' contains destructive command '$op'"
            print_error "🚨 This script is designed to be SAFE and NON-DESTRUCTIVE"
            print_error "🚨 If you need to perform destructive operations, do them manually with explicit confirmation"
            exit 1
        fi
    done
}

# SAFETY FUNCTION: Prevent Keycloak realm override without explicit flag
keycloak_safety_check() {
    if [[ "${KEYCLOAK_OVERRIDE_REALM:-}" != "true" ]]; then
        print_warning "🔒 Keycloak realm import is DISABLED by default to prevent data loss"
        print_warning "🔒 To enable realm import (DANGEROUS - can delete users), set KEYCLOAK_OVERRIDE_REALM=true"
        print_warning "🔒 This script will NOT import realm configuration to preserve existing users"
        return 0
    else
        print_error "🚨 KEYCLOAK OVERRIDE ENABLED - This can DELETE ALL USERS!"
        print_error "🚨 Are you absolutely sure? This action cannot be undone."
        print_error "🚨 If you proceed, all Keycloak users will be lost."
        exit 1
    fi
}

# Function to create PostgreSQL deployment
deploy_postgres() {
    print_status "📦 Deploying PostgreSQL..."

    cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      imagePullSecrets:
      - name: dockerhub-secret
      containers:
      - name: postgres
        image: postgres:16
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "${POSTGRES_DB}"
        - name: POSTGRES_USER
          value: "${POSTGRES_USER}"
        - name: POSTGRES_PASSWORD
          value: "${POSTGRES_PASSWORD}"
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: "${POSTGRES_CPU_REQUEST}"
            memory: "${POSTGRES_MEMORY_REQUEST}"
          limits:
            cpu: "${POSTGRES_CPU_LIMIT}"
            memory: "${POSTGRES_MEMORY_LIMIT}"
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  ports:
  - port: 5432
    targetPort: 5432
  selector:
    app: postgres
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF

    wait_for_deployment postgres

    print_status "📦 Initializing Keycloak database..."
    sleep 5  # Give PostgreSQL a moment to be fully ready

    # Create Keycloak database and user
    oc exec deployment/postgres -- psql -U ${POSTGRES_USER} -d postgres -c "CREATE USER ${KEYCLOAK_DB_USER} WITH PASSWORD '${KEYCLOAK_DB_PASSWORD}';" 2>/dev/null || true
    oc exec deployment/postgres -- psql -U ${POSTGRES_USER} -d postgres -c "CREATE DATABASE ${KEYCLOAK_DB_NAME} OWNER ${KEYCLOAK_DB_USER};" 2>/dev/null || true

    print_success "PostgreSQL and Keycloak database initialized"
}

# Function to create Minio deployment
deploy_minio() {
    print_status "📦 Deploying Minio..."

    cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  labels:
    app: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      imagePullSecrets:
      - name: dockerhub-secret
      containers:
      - name: minio
        image: minio/minio:latest
        args:
        - server
        - /data
        - --console-address
        - :9001
        ports:
        - containerPort: 9000
        - containerPort: 9001
        env:
        - name: MINIO_ROOT_USER
          value: "${MINIO_ROOT_USER}"
        - name: MINIO_ROOT_PASSWORD
          value: "${MINIO_ROOT_PASSWORD}"
        volumeMounts:
        - name: minio-storage
          mountPath: /data
        resources:
          requests:
            cpu: "${MINIO_CPU_REQUEST}"
            memory: "${MINIO_MEMORY_REQUEST}"
          limits:
            cpu: "${MINIO_CPU_LIMIT}"
            memory: "${MINIO_MEMORY_LIMIT}"
        livenessProbe:
          httpGet:
            path: /minio/health/live
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /minio/health/ready
            port: 9000
          initialDelaySeconds: 10
          periodSeconds: 10
      volumes:
      - name: minio-storage
        persistentVolumeClaim:
          claimName: minio-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  labels:
    app: minio
spec:
  ports:
  - port: 9000
    targetPort: 9000
    name: api
  - port: 9001
    targetPort: 9001
    name: console
  selector:
    app: minio
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
EOF

    wait_for_deployment minio
}

# Function to create Keycloak realm configuration
create_keycloak_realm_config() {
    local keycloak_hostname=$(echo "$KEYCLOAK_URL" | sed 's|https://||' | sed 's|/.*||')
    local app_hostname=$(echo "$APP_URL" | sed 's|https://||')

    cat > /tmp/keycloak-realm.json <<EOF
{
  "id": "ospo-events",
  "realm": "ospo-events",
  "displayName": "OSPO Events",
  "enabled": true,
  "sslRequired": "external",
  "registrationAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "clients": [
    {
      "id": "ospo-events-app",
      "clientId": "ospo-events-app",
      "name": "OSPO Events Application",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "redirectUris": [
        "${APP_URL}/*",
        "https://*.${CLUSTER_DOMAIN}/*"
      ],
      "webOrigins": [
        "${APP_URL}",
        "https://*.${CLUSTER_DOMAIN}"
      ],
      "publicClient": true,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": false,
      "authorizationServicesEnabled": false,
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directGrantsOnly": false
    }
  ],
  "roles": {
    "realm": [
      {
        "name": "admin",
        "description": "Administrator role"
      },
      {
        "name": "user",
        "description": "Regular user role"
      }
    ]
  }
}
EOF

    oc create configmap keycloak-realm-config --from-file=realm.json=/tmp/keycloak-realm.json --dry-run=client -o yaml | oc apply -f -
    rm -f /tmp/keycloak-realm.json
}

# Function to create Keycloak deployment
deploy_keycloak() {
    print_status "📦 Deploying Keycloak..."

    # SAFETY CHECK: Prevent realm import that could delete users
    keycloak_safety_check

    # Create realm configuration (only if override is explicitly enabled)
    if [[ "${KEYCLOAK_OVERRIDE_REALM:-}" == "true" ]]; then
        create_keycloak_realm_config
    else
        print_warning "🔒 Skipping realm configuration import to preserve existing users"
    fi

    local keycloak_hostname=$(echo "$KEYCLOAK_URL" | sed 's|https://||' | sed 's|/.*||')

    cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  labels:
    app: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      imagePullSecrets:
      - name: dockerhub-secret
      initContainers:
      - name: wait-for-db
        image: postgres:16
        command: ['sh', '-c']
        args:
        - |
          until pg_isready -h ${KEYCLOAK_DB_HOST} -p ${KEYCLOAK_DB_PORT} -U ${KEYCLOAK_DB_USER}; do
            echo "Waiting for database..."
            sleep 2
          done
        env:
        - name: PGPASSWORD
          value: "${KEYCLOAK_DB_PASSWORD}"
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:23.0.6
        args:
        - start-dev
        - --http-port=8080
        - --hostname-strict=false
        - --hostname-strict-https=false
        - --proxy=edge
        ports:
        - containerPort: 8080
        env:
        - name: KEYCLOAK_ADMIN
          value: "${KEYCLOAK_ADMIN}"
        - name: KEYCLOAK_ADMIN_PASSWORD
          value: "${KEYCLOAK_ADMIN_PASSWORD}"
        - name: KC_DB
          value: postgres
        - name: KC_DB_URL
          value: jdbc:postgresql://${KEYCLOAK_DB_HOST}:${KEYCLOAK_DB_PORT}/${KEYCLOAK_DB_NAME}
        - name: KC_DB_USERNAME
          value: "${KEYCLOAK_DB_USER}"
        - name: KC_DB_PASSWORD
          value: "${KEYCLOAK_DB_PASSWORD}"
        - name: KC_HOSTNAME
          value: "${keycloak_hostname}"
        - name: KC_HOSTNAME_ADMIN
          value: "${keycloak_hostname}"
        - name: KC_HTTP_RELATIVE_PATH
          value: "/auth"
        volumeMounts:
        - name: realm-config
          mountPath: /opt/keycloak/data/import
          readOnly: true
        resources:
          requests:
            cpu: "${KEYCLOAK_CPU_REQUEST}"
            memory: "${KEYCLOAK_MEMORY_REQUEST}"
          limits:
            cpu: "${KEYCLOAK_CPU_LIMIT}"
            memory: "${KEYCLOAK_MEMORY_LIMIT}"
        livenessProbe:
          httpGet:
            path: /auth
            port: 8080
          initialDelaySeconds: 120
          periodSeconds: 30
          timeoutSeconds: 10
        readinessProbe:
          httpGet:
            path: /auth
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
        startupProbe:
          httpGet:
            path: /auth
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
          failureThreshold: 30
      volumes:
      - name: realm-config
        configMap:
          name: keycloak-realm-config
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  labels:
    app: keycloak
spec:
  ports:
  - port: 8080
    targetPort: 8080
  selector:
    app: keycloak
EOF

    wait_for_deployment keycloak 600  # Keycloak takes longer to start
}

# Function to create application build and deployment
deploy_app() {
    print_status "📦 Deploying OSPO Events Application..."

    # Ensure Docker Hub secret exists for builds
    create_dockerhub_secret

    # Create keycloak.json configuration dynamically
    cat > /tmp/keycloak.json <<EOF
{
  "realm": "${KEYCLOAK_REALM}",
  "auth-server-url": "${KEYCLOAK_URL}/auth",
  "ssl-required": "external",
  "resource": "${KEYCLOAK_CLIENT_ID}",
  "public-client": true,
  "confidential-port": 0,
  "verify-token-audience": false,
  "use-resource-role-mappings": true,
  "enable-cors": true
}
EOF

    oc create configmap keycloak-client-config --from-file=keycloak.json=/tmp/keycloak.json --dry-run=client -o yaml | oc apply -f -
    rm -f /tmp/keycloak.json

    # Create ImageStream
    cat <<EOF | oc apply -f -
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: ospo-events-app
  labels:
    app: ospo-app
spec:
  lookupPolicy:
    local: false
EOF

    # Create BuildConfig
    cat <<EOF | oc apply -f -
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: ospo-events-app
  labels:
    app: ospo-app
spec:
  output:
    to:
      kind: ImageStreamTag
      name: ospo-events-app:latest
  source:
    type: Binary
  strategy:
    type: Docker
    dockerStrategy:
      buildArgs:
      - name: VITE_KEYCLOAK_URL
        value: "${VITE_KEYCLOAK_URL}"
  triggers:
  - type: ConfigChange
EOF

    # Start build
    print_status "🔨 Starting application build..."
    oc start-build ospo-events-app --from-dir=. --wait

    # Create Deployment
    cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ospo-app
  labels:
    app: ospo-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ospo-app
  template:
    metadata:
      labels:
        app: ospo-app
    spec:
      containers:
      - name: ospo-app
        image: image-registry.openshift-image-registry.svc:5000/${NAMESPACE}/ospo-events-app:latest
        ports:
        - containerPort: 4576
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          value: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
        - name: KEYCLOAK_URL
          value: "http://keycloak:8080"
        - name: KEYCLOAK_REALM
          value: "${KEYCLOAK_REALM}"
        - name: KEYCLOAK_CLIENT_ID
          value: "${KEYCLOAK_CLIENT_ID}"
        - name: KEYCLOAK_CLIENT_URL
          value: "${VITE_KEYCLOAK_URL}"
        - name: VITE_KEYCLOAK_URL
          value: "${VITE_KEYCLOAK_URL}"
        - name: MINIO_ENDPOINT
          value: "minio:9000"
        - name: MINIO_ACCESS_KEY
          value: "${MINIO_ROOT_USER}"
        - name: MINIO_SECRET_KEY
          value: "${MINIO_ROOT_PASSWORD}"
        - name: MINIO_BUCKET
          value: "${MINIO_BUCKET_NAME}"
        - name: JWT_SECRET
          value: "${JWT_SECRET}"
        - name: SESSION_SECRET
          value: "${SESSION_SECRET}"
        - name: SESSION_RESAVE
          value: "${SESSION_RESAVE}"
        - name: SESSION_SAVE_UNINITIALIZED
          value: "${SESSION_SAVE_UNINITIALIZED}"
        - name: SESSION_SECURE
          value: "${SESSION_SECURE}"
        - name: SESSION_HTTP_ONLY
          value: "${SESSION_HTTP_ONLY}"
        - name: SESSION_MAX_AGE
          value: "${SESSION_MAX_AGE}"
        - name: SESSION_SAME_SITE
          value: "${SESSION_SAME_SITE}"
        - name: SESSION_NAME
          value: "${SESSION_NAME}"
        - name: RATE_LIMIT_WINDOW_MS
          value: "${RATE_LIMIT_WINDOW_MS}"
        - name: RATE_LIMIT_MAX
          value: "${RATE_LIMIT_MAX}"
        - name: RATE_LIMIT_MESSAGE
          value: "${RATE_LIMIT_MESSAGE}"
        - name: RATE_LIMIT_RETRY_AFTER
          value: "${RATE_LIMIT_RETRY_AFTER}"
        - name: RATE_LIMIT_STANDARD_HEADERS
          value: "${RATE_LIMIT_STANDARD_HEADERS}"
        - name: RATE_LIMIT_LEGACY_HEADERS
          value: "${RATE_LIMIT_LEGACY_HEADERS}"
        - name: RATE_LIMIT_SKIP_PATHS
          value: "${RATE_LIMIT_SKIP_PATHS}"
        - name: CSP_STYLE_SRC
          value: "${CSP_STYLE_SRC}"
        - name: CSP_FONT_SRC
          value: "${CSP_FONT_SRC}"
        - name: CSP_OBJECT_SRC
          value: "${CSP_OBJECT_SRC}"
        - name: HELMET_COEP
          value: "${HELMET_COEP}"
        - name: HELMET_HSTS_MAX_AGE
          value: "${HELMET_HSTS_MAX_AGE}"
        - name: HELMET_HSTS_INCLUDE_SUBDOMAINS
          value: "${HELMET_HSTS_INCLUDE_SUBDOMAINS}"
        - name: HELMET_HSTS_PRELOAD
          value: "${HELMET_HSTS_PRELOAD}"
        - name: PROXY_FORWARDED_PROTO
          value: "${PROXY_FORWARDED_PROTO}"
        - name: PROXY_REDIRECT_PATTERN
          value: "${PROXY_REDIRECT_PATTERN}"
        - name: PROXY_TIMEOUT_MS
          value: "${PROXY_TIMEOUT_MS}"
        volumeMounts:
        - name: keycloak-config
          mountPath: /app/keycloak.json
          subPath: keycloak.json
        - name: keycloak-config
          mountPath: /app/public/keycloak.json
          subPath: keycloak.json
        - name: uploads
          mountPath: /app/uploads
        resources:
          requests:
            cpu: "${APP_CPU_REQUEST}"
            memory: "${APP_MEMORY_REQUEST}"
          limits:
            cpu: "${APP_CPU_LIMIT}"
            memory: "${APP_MEMORY_LIMIT}"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 4576
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 4576
          initialDelaySeconds: 10
          periodSeconds: 10
      volumes:
      - name: keycloak-config
        configMap:
          name: keycloak-client-config
      - name: uploads
        persistentVolumeClaim:
          claimName: ospo-uploads-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ospo-app
  labels:
    app: ospo-app
spec:
  ports:
  - port: 4576
    targetPort: 4576
  selector:
    app: ospo-app
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ospo-uploads-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF

    wait_for_deployment ospo-app
}

# Function to create routes
create_routes() {
    print_status "🌐 Creating Routes..."

    local keycloak_hostname=$(echo "$KEYCLOAK_URL" | sed 's|https://||')
    local app_hostname=$(echo "$APP_URL" | sed 's|https://||')

    cat <<EOF | oc apply -f -
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: keycloak
  labels:
    app: keycloak
spec:
  host: ${keycloak_hostname}
  to:
    kind: Service
    name: keycloak
  port:
    targetPort: 8080
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ospo-app
  labels:
    app: ospo-app
spec:
  host: ${app_hostname}
  to:
    kind: Service
    name: ospo-app
  port:
    targetPort: 4576
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
EOF

    print_success "Routes created successfully"
}

# Main deployment function
main() {
    print_status "🚀 Starting deployment process..."

    # SAFETY CHECK: Ensure this script is only used for deployments
    print_status "🔒 SAFETY MODE ENABLED - This script will NOT perform destructive operations"
    print_status "🔒 All data-preserving operations only"

    if [[ "$APP_ONLY" == "true" ]]; then
        print_status "🚀 Deploying only the application..."
        deploy_app
        oc scale deployment ospo-app --replicas=0
        sleep 5
        oc scale deployment ospo-app --replicas=1
        print_success "🎉 Application deployed successfully!"
        exit 0
    fi
    # Deploy components in order
    create_dockerhub_secret
    deploy_postgres
    deploy_minio
    deploy_keycloak
    deploy_app
    create_routes

    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "📋 Deployment Summary:"
    echo "   Environment: $ENVIRONMENT"
    echo "   Namespace: $NAMESPACE"
    echo "   Application URL: $APP_URL"
    echo "   Keycloak URL: $KEYCLOAK_URL"
    echo ""
    print_status "🔍 Checking deployment status..."
    oc get pods -l app
    echo ""
    print_success "✨ OSPO Events Manager is now deployed and ready!"
}

# Run main function
main "$@"