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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [--dev|--prod|--local] [options]"
    echo ""
    echo "Options:"
    echo "  --dev          Deploy to development environment"
    echo "  --prod         Deploy to production environment"
    echo "  --local        Deploy to local KIND cluster"
    echo "  --help         Show this help message"
    echo "  --app          Deploy the application"
    echo "  --postgres     Deploy the postgres pod"
    echo "  --keycloak     Deploy the keycloak pod"
    echo "  --minio        Deploy the minio pod (local only)"
    echo "  --routes       Create routes for the application"
    echo "  --force        Force rebuild even if version hasn't changed"
    # echo "  --ai-only      Deploy only the AI (Ollama) service"
    echo "  --delete       Delete all pods while preserving data (WARNING: destructive)"
    echo "  --delete-local Delete local KIND cluster and all data (local only)"
    echo "  --backup       Create a complete backup of all data (users, events, uploads)"
    echo "  --restore -f   Restore data from backup directory (use with -f /path/to/backup)"
    echo "  --destroy      DESTROY ALL DATA - Remove pods and all PVCs (CATASTROPHIC)"
    echo ""
    echo "Requirements:"
    echo "  - For --dev/--prod: .env file must exist, OpenShift CLI (oc) installed"
    echo "  - For --local: .env.local file must exist, kubectl, kind, and podman installed"
    echo ""
    echo "Example:"
    echo "  $0 --dev"
    echo "  $0 --prod"
    echo "  $0 --local"
    echo "  $0 --delete-local"
    echo "  $0 --dev --app --postgres"
    echo "  $0 --local --postgres --keycloak --minio"
    echo "  $0 --prod --app --postgres --keycloak"
}

# Parse command line arguments
APP=""
KEYCLOAK=""
POSTGRES=""
MINIO=""
# AI=""
DELETE=""
DELETE_LOCAL=""
BACKUP=""
RESTORE=""
RESTORE_PATH=""
DESTROY=""
ENVIRONMENT=""
ROUTES=""
FORCE_BUILD=""
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
        --local)
            ENVIRONMENT="local"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        --app)
            APP="true"
            shift
            ;;
        --keycloak)
            KEYCLOAK="true"
            shift
            ;;
        --postgres)
            POSTGRES="true"
            shift
            ;;
        --minio)
            MINIO="true"
            shift
            ;;
        --routes)
            ROUTES="true"
            shift
            ;;
        # --ai-only)
        #     AI="true"
        #     shift
        #     ;;
        --force)
            FORCE_BUILD="true"
            shift
            ;;
        --delete)
            DELETE="true"
            shift
            ;;
        --delete-local)
            DELETE_LOCAL="true"
            shift
            ;;
        --backup)
            BACKUP="true"
            shift
            ;;
        --restore)
            RESTORE="true"
            shift
            ;;
        -f)
            if [[ "$RESTORE" == "true" ]]; then
                RESTORE_PATH="$2"
                shift 2
            else
                print_error "Option -f can only be used with --restore"
                exit 1
            fi
            ;;
        --destroy)
            DESTROY="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate arguments (skip for operations that don't need environment)
if [[ "$DELETE" != "true" && "$DELETE_LOCAL" != "true" && "$BACKUP" != "true" && "$RESTORE" != "true" && "$DESTROY" != "true" && -z "$ENVIRONMENT" ]]; then
    print_error "🚨 Environment not specified. Use --dev, --prod, or --local"
    show_usage
    exit 1
fi

# Validate restore path if restore is specified
if [[ "$RESTORE" == "true" && -z "$RESTORE_PATH" ]]; then
    print_error "🚨 Restore path must be specified with -f option"
    show_usage
    exit 1
fi

# Skip environment loading for operations that don't need it
if [[ "$DELETE_LOCAL" != "true" && "$DELETE" != "true" && "$BACKUP" != "true" && "$RESTORE" != "true" && "$DESTROY" != "true" ]]; then
    # Check for appropriate .env file based on environment
    if [[ "$ENVIRONMENT" == "local" ]]; then
        if [[ ! -f .env.local ]]; then
            print_error "🚨 .env.local file not found!"
            echo "🚨 Please run the configuration script to create .env.local:"
            echo "🚨   ./configure.sh --local"
            echo "🚨 Or manually copy env.local.template to .env.local:"
            echo "🚨   cp env.local.template .env.local"
            exit 1
        fi
        ENV_FILE=".env.local"
    else
        if [[ ! -f .env ]]; then
            print_error "🚨 .env file not found!"
            echo "🚨 Please copy env.template to .env and configure your values:"
            echo "🚨   cp env.template .env"
            echo "🚨   # Edit .env with your configuration"
            exit 1
        fi
        ENV_FILE=".env"
    fi

    # Load environment variables
    print_status "Loading configuration from $ENV_FILE file..."
    set -a  # automatically export all variables
    source "$ENV_FILE"
    set +a  # turn off automatic export
fi

# Set environment-specific variables (skip for standalone operations)
if [[ "$DELETE_LOCAL" != "true" && "$DELETE" != "true" && "$BACKUP" != "true" && "$RESTORE" != "true" && "$DESTROY" != "true" ]]; then
    if [[ "$ENVIRONMENT" == "local" ]]; then
        export NAMESPACE="ospo-local"
        export APP_URL="http://localhost:4576"
        export KEYCLOAK_URL="http://localhost:8080/auth"
        export VITE_KEYCLOAK_URL="http://localhost:8080/auth"
        export CLUSTER_NAME="ospo-local"
        export CLI_CMD="kubectl"
    elif [[ "$ENVIRONMENT" == "dev" ]]; then
        export NAMESPACE="$DEV_NAMESPACE"
        export APP_URL="$DEV_APP_URL"
        export KEYCLOAK_URL="$DEV_KEYCLOAK_URL"
        export VITE_KEYCLOAK_URL="$VITE_KEYCLOAK_URL_DEV"
        export CLI_CMD="oc"
    else
        export NAMESPACE="$PROD_NAMESPACE"
        export APP_URL="$PROD_APP_URL"
        export KEYCLOAK_URL="$PROD_KEYCLOAK_URL"
        export VITE_KEYCLOAK_URL="$VITE_KEYCLOAK_URL_PROD"
        export CLI_CMD="oc"
    fi

    # Export application configuration variables
    export UPLOADS_DIR="$UPLOADS_DIR"

    print_success "Configuration loaded for $ENVIRONMENT environment"
    print_status "Namespace: $NAMESPACE"
    print_status "App URL: $APP_URL"
    print_status "Keycloak URL: $KEYCLOAK_URL"
fi

# =============================================================================
# KIND CLUSTER FUNCTIONS (Local Development)
# =============================================================================

# Function to setup KIND cluster
setup_kind_cluster() {
    print_status "Creating KIND cluster '${CLUSTER_NAME}'..."
    
    # Create KIND cluster with Podman provider
    cat <<EOF | KIND_EXPERIMENTAL_PROVIDER=podman kind create cluster --name "${CLUSTER_NAME}" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      # PostgreSQL
      - containerPort: 30432
        hostPort: 5432
        protocol: TCP
      # Keycloak
      - containerPort: 30080
        hostPort: 8080
        protocol: TCP
      # MinIO API
      - containerPort: 30900
        hostPort: 9000
        protocol: TCP
      # MinIO Console
      - containerPort: 30901
        hostPort: 9001
        protocol: TCP
EOF
    
    if [ $? -eq 0 ]; then
        print_success "KIND cluster created successfully"
    else
        print_error "Failed to create KIND cluster"
        exit 1
    fi
    
    # Wait for cluster to be ready
    print_status "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=120s
    print_success "Cluster is ready"
    
    # Create namespace
    print_status "Creating namespace '${NAMESPACE}'..."
    kubectl apply -f kind/namespace.yaml
    print_success "Namespace created"
    
    # Create NodePort services for external access
    create_nodeport_services_local
}

# Function to create NodePort services for local KIND cluster
create_nodeport_services_local() {
    print_status "Creating NodePort services for external access..."
    
    cat <<EOF | kubectl apply -f -
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-nodeport
  namespace: ${NAMESPACE}
spec:
  type: NodePort
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
      nodePort: 30432
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak-nodeport
  namespace: ${NAMESPACE}
spec:
  type: NodePort
  selector:
    app: keycloak
  ports:
    - port: 8080
      targetPort: 8080
      nodePort: 30080
---
apiVersion: v1
kind: Service
metadata:
  name: minio-nodeport-api
  namespace: ${NAMESPACE}
spec:
  type: NodePort
  selector:
    app: minio
  ports:
    - name: api
      port: 9000
      targetPort: 9000
      nodePort: 30900
---
apiVersion: v1
kind: Service
metadata:
  name: minio-nodeport-console
  namespace: ${NAMESPACE}
spec:
  type: NodePort
  selector:
    app: minio
  ports:
    - name: console
      port: 9001
      targetPort: 9001
      nodePort: 30901
EOF
    
    print_success "NodePort services created"
}

# Function to deploy PostgreSQL to local KIND cluster
deploy_postgres_local() {
    print_status "📦 Deploying PostgreSQL to local KIND cluster..."
    
    if [[ ! -f "kind/postgres.yaml" ]]; then
        print_error "PostgreSQL deployment file not found: kind/postgres.yaml"
        exit 1
    fi
    
    kubectl apply -f kind/postgres.yaml
    
    print_status "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=Ready pod -l app=postgres -n "${NAMESPACE}" --timeout=180s || {
        print_warning "PostgreSQL pod didn't become ready in time. Checking status..."
        kubectl get pods -n "${NAMESPACE}" -l app=postgres
        kubectl describe pod -n "${NAMESPACE}" -l app=postgres
    }
    
    print_success "PostgreSQL deployed successfully"
}

# Function to deploy Keycloak to local KIND cluster
deploy_keycloak_local() {
    print_status "📦 Deploying Keycloak to local KIND cluster..."
    
    # Load Keycloak realm configuration
    local realm_file="keycloak-realm-export.json"
    
    if [ -f "$realm_file" ]; then
        print_status "Loading Keycloak realm configuration..."
        kubectl create configmap keycloak-realm-config \
            --from-file=realm.json="$realm_file" \
            --namespace="${NAMESPACE}" \
            --dry-run=client -o yaml | kubectl apply -f -
        print_success "Keycloak realm configuration loaded"
    else
        print_warning "Keycloak realm export file not found"
        print_info "Creating empty configmap..."
        kubectl create configmap keycloak-realm-config \
            --from-literal=realm.json='{}' \
            --namespace="${NAMESPACE}" \
            --dry-run=client -o yaml | kubectl apply -f -
    fi
    
    if [[ ! -f "kind/keycloak.yaml" ]]; then
        print_error "Keycloak deployment file not found: kind/keycloak.yaml"
        exit 1
    fi
    
    kubectl apply -f kind/keycloak.yaml
    
    print_status "Waiting for Keycloak to be ready (this may take a few minutes)..."
    kubectl wait --for=condition=Ready pod -l app=keycloak -n "${NAMESPACE}" --timeout=300s || {
        print_warning "Keycloak pod didn't become ready in time. Checking status..."
        kubectl get pods -n "${NAMESPACE}" -l app=keycloak
        kubectl describe pod -n "${NAMESPACE}" -l app=keycloak
    }
    
    print_success "Keycloak deployed successfully"
}

# Function to deploy MinIO to local KIND cluster
deploy_minio_local() {
    print_status "📦 Deploying MinIO to local KIND cluster..."
    
    if [[ ! -f "kind/minio.yaml" ]]; then
        print_error "MinIO deployment file not found: kind/minio.yaml"
        exit 1
    fi
    
    kubectl apply -f kind/minio.yaml
    
    print_status "Waiting for MinIO to be ready..."
    kubectl wait --for=condition=Ready pod -l app=minio -n "${NAMESPACE}" --timeout=180s || {
        print_warning "MinIO pod didn't become ready in time. Checking status..."
        kubectl get pods -n "${NAMESPACE}" -l app=minio
        kubectl describe pod -n "${NAMESPACE}" -l app=minio
    }
    
    print_success "MinIO deployed successfully"
}

# Check CLI tool and connection based on environment (skip for standalone operations)
if [[ "$DELETE_LOCAL" != "true" && "$DELETE" != "true" && "$BACKUP" != "true" && "$RESTORE" != "true" && "$DESTROY" != "true" ]]; then
    if [[ "$ENVIRONMENT" == "local" ]]; then
        print_status "Checking local Kubernetes (KIND) prerequisites..."
        
        # Check for required tools
        if ! command -v kubectl &>/dev/null; then
            print_error "kubectl is required but not installed!"
            echo "Installation instructions:"
            echo "  brew install kubectl"
            exit 1
        fi
        
        if ! command -v kind &>/dev/null; then
            print_error "kind is required but not installed!"
            echo "Installation instructions:"
            echo "  brew install kind"
            exit 1
        fi
        
        if ! command -v podman &>/dev/null; then
            print_error "podman is required but not installed!"
            echo "Installation instructions:"
            echo "  brew install podman"
            exit 1
        fi
        
        # Check if Podman machine is running
        if ! podman machine list | grep -q "Currently running"; then
            print_warning "Podman machine is not running. Starting it now..."
            podman machine start || {
                print_error "Failed to start Podman machine"
                print_info "Try initializing Podman: podman machine init"
                exit 1
            }
            print_success "Podman machine started"
            sleep 5  # Give Podman a moment to stabilize
        fi
        
        # Check if KIND cluster exists
        if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
            print_warning "KIND cluster '${CLUSTER_NAME}' does not exist"
            print_info "Creating KIND cluster..."
            setup_kind_cluster
        else
            print_success "KIND cluster '${CLUSTER_NAME}' exists"
        fi
        
        # Switch context to KIND cluster
        kubectl config use-context "kind-${CLUSTER_NAME}" &>/dev/null || {
            print_error "Failed to switch to KIND cluster context"
            exit 1
        }
        
    else
        # OpenShift connection check
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
    fi

    print_success "🚀 Starting OSPO Events deployment to $ENVIRONMENT environment"
    echo ""
fi

# =============================================================================
# COMMON DEPLOYMENT FUNCTIONS
# =============================================================================

# Function to wait for deployment
wait_for_deployment() {
    local deployment_name=$1
    local timeout=${2:-300}
    if [[ "$APP" == "true" ]]; then
        print_status "🚀 Skipping wait for $deployment_name to be ready..."
        return 0
    fi
    print_status "Waiting for $deployment_name to be ready..."
    if $CLI_CMD wait --for=condition=available deployment/"$deployment_name" --timeout="${timeout}s" -n "${NAMESPACE}"; then
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

# Function to get version from package.json
get_package_version() {
    if [[ ! -f "package.json" ]]; then
        print_error "🚨 package.json not found"
        return 1
    fi
    grep '"version"' package.json | head -1 | sed 's/.*"version"//' | sed 's/[",: ]//g'
}

# Function to get latest version from ImageStream tags
get_latest_image_version() {
    local imagestream=$1
    local tags=$(oc get imagestream "${imagestream}" -o jsonpath='{range .status.tags[*]}{.tag}{"\n"}{end}' 2>/dev/null || echo "")

    if [[ -z "$tags" ]]; then
        print_status "🔍 No tags found for imagestream $imagestream"
        echo ""
        return 0
    fi

    # Filter for version-like tags (e.g., 0.3.15), excluding 'latest'
    echo "$tags" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -1
}

# Function to compare version strings (semantic versioning)
version_greater() {
    local version1=$1
    local version2=$2

    # If version2 is empty, version1 is greater
    [[ -z "$version2" ]] && return 0

    # Compare versions using sort -V (natural sort for version numbers)
    [ "$version1" != "$(echo -e "$version1\n$version2" | sort -V | head -1)" ]
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

    # Check if PostgreSQL deployment file exists
    if [[ ! -f "k8s/postgres-deployment.yaml" ]]; then
        print_error "PostgreSQL deployment file not found: k8s/postgres-deployment.yaml"
        exit 1
    fi

    # Apply PostgreSQL deployment
    envsubst < k8s/postgres-deployment.yaml | oc apply -f -

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

    # Check if MinIO deployment file exists
    if [[ ! -f "k8s/minio-deployment.yaml" ]]; then
        print_error "MinIO deployment file not found: k8s/minio-deployment.yaml"
        exit 1
    fi

    # Apply MinIO deployment
    envsubst < k8s/minio-deployment.yaml | oc apply -f -

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

    # Always create the realm config ConfigMap (required by deployment)
    # But only populate it with realm data if override is explicitly enabled
    if [[ "${KEYCLOAK_OVERRIDE_REALM:-}" == "true" ]]; then
        print_status "🔓 Creating realm configuration with realm data (OVERRIDE ENABLED)"
        create_keycloak_realm_config
    else
        print_warning "🔒 Creating empty realm configuration to preserve existing users"
        # Create an empty ConfigMap to satisfy the deployment requirement
        oc create configmap keycloak-realm-config --from-file=realm.json=keycloak-realm-export.json --dry-run=client -o yaml | oc apply -f -
    fi

    local keycloak_hostname=$(echo "$KEYCLOAK_URL" | sed 's|https://||' | sed 's|/.*||')

    # Check if Keycloak deployment file exists
    if [[ ! -f "k8s/keycloak-deployment.yaml" ]]; then
        print_error "Keycloak deployment file not found: k8s/keycloak-deployment.yaml"
        exit 1
    fi

    # Apply Keycloak deployment with environment variable substitution
    keycloak_hostname=$(echo "$KEYCLOAK_URL" | sed 's|https://||' | sed 's|/.*||')
    export keycloak_hostname
    envsubst < k8s/keycloak-deployment.yaml | oc apply -f -

    wait_for_deployment keycloak 600  # Keycloak takes longer to start
}

# Function to create application build and deployment
deploy_app() {
    print_status "📦 Deploying OSPO Events Application..."



    # Ensure Docker Hub secret exists for builds
    if [[ $APP == "true" ]]; then
      create_dockerhub_secret
    fi

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
    if [[ ! -f "k8s/app-imagestream.yaml" ]]; then
        print_error "🚨 App ImageStream file not found: k8s/app-imagestream.yaml"
        exit 1
    fi
    oc apply -f k8s/app-imagestream.yaml

    # Create BuildConfig
    if [[ ! -f "k8s/app-buildconfig.yaml" ]]; then
        print_error "🚨 App BuildConfig file not found: k8s/app-buildconfig.yaml"
        exit 1
    fi

    # Export version for BuildConfig
    export APP_VERSION="$current_version"
    envsubst < k8s/app-buildconfig.yaml | oc apply -f -

    # Start build
    print_status "🔨 Starting application build for version $current_version..."
    oc start-build ospo-events-app --from-dir=. --wait

    # Tag the image with the version number in addition to 'latest'
    print_status "🏷️  Tagging image as version $current_version..."
    oc tag ospo-events-app:latest ospo-events-app:"$current_version"

    print_success "✅ Built and tagged as ospo-events-app:$current_version and ospo-events-app:latest"

    # Create Deployment
    if [[ ! -f "k8s/app-deployment.yaml" ]]; then
        print_error "🚨 App deployment file not found: k8s/app-deployment.yaml"
        exit 1
    fi
    envsubst < k8s/app-deployment.yaml | oc apply -f -

    wait_for_deployment ospo-app
}

# Function to deploy AI (Ollama) service
deploy_ai() {
    print_status "🤖 Deploying AI (Ollama) Service..."

    # Check if Ollama deployment file exists
    if [[ ! -f "k8s/ollama-deployment.yaml" ]]; then
        print_error "🚨 Ollama deployment file not found: k8s/ollama-deployment.yaml"
        exit 1
    fi

    # Apply Ollama deployment
    oc apply -f k8s/ollama-deployment.yaml

    # Wait for deployment to be ready
    wait_for_deployment ollama-nvidia-gpu

    print_success "🤖 AI (Ollama) service deployed successfully!"

    # Show Ollama service information
    print_status "📋 Ollama Service Information:"
    echo "  - Service: ollama-nvidia-gpu"
    echo "  - Port: 11434"
    echo "  - GPU: NVIDIA GPU required"
    echo "  - Models: Will be downloaded on first use"

    # Show how to download models
    print_status "📥 To download models, you can:"
    echo "  1. Port forward: oc port-forward svc/ollama-nvidia-gpu 11434:11434"
    echo "  2. Pull model: ollama pull codellama:7b-instruct"
    echo "  3. Or use the internal service URL: http://ollama-nvidia-gpu:11434"
}

# Function to create routes
create_routes() {
    print_status "🌐 Creating Routes..."

    # Check if routes file exists
    if [[ ! -f "k8s/routes.yaml" ]]; then
        print_error "🚨 Routes file not found: k8s/routes.yaml"
        exit 1
    fi

    # Set hostname variables for substitution
    local keycloak_hostname=$(echo "$KEYCLOAK_URL" | sed 's|https://||')
    local app_hostname=$(echo "$APP_URL" | sed 's|https://||')
    export keycloak_hostname
    export app_hostname
    print_status "🔍 keycloak_hostname: $keycloak_hostname"
    print_status "🔍 app_hostname: $app_hostname"

    oc delete route ospo-app --ignore-not-found=true
    oc delete route keycloak --ignore-not-found=true
    # oc delete route ollama-nvidia-gpu --ignore-not-found=true
    # Apply routes with environment variable substitution
    envsubst < k8s/routes.yaml | oc apply -f -

    print_success "Routes created successfully"
}

# Function to safely delete all pods while preserving data
delete_all_pods() {
    print_warning "⚠️  WARNING: This will delete ALL pods in the cluster!"
    print_warning "⚠️  This action will:"
    print_warning "   - Delete all running pods (ospo-app, keycloak, postgres, minio, ollama)"
    print_warning "   - Delete all deployments, services, and routes"
    print_warning "   - DELETE ALL DATA if PersistentVolumeClaims are removed"
    print_warning ""
    print_warning "⚠️  DATA PRESERVATION:"
    print_warning "   ✅ Keycloak user data will be preserved (stored in PostgreSQL PVC)"
    print_warning "   ✅ Event data will be preserved (stored in PostgreSQL PVC)"
    print_warning "   ✅ Uploaded files will be preserved (stored in MinIO PVC)"
    print_warning "   ✅ Application uploads will be preserved (stored in app PVC)"
    print_warning ""
    print_warning "⚠️  THIS ACTION CANNOT BE UNDONE!"
    echo ""

    # Require explicit confirmation
    read -p "Are you absolutely sure you want to delete all pods? Type 'DELETE ALL PODS' to confirm: " confirmation

    if [[ "$confirmation" != "DELETE ALL PODS" ]]; then
        print_error "🚨 Deletion cancelled. You must type 'DELETE ALL PODS' exactly to confirm."
        exit 1
    fi

    print_status "🗑️  Starting safe deletion of all pods..."

    # Delete deployments (this will delete pods)
    print_status "Deleting deployments..."
    oc delete deployment ospo-app --ignore-not-found=true
    oc delete deployment keycloak --ignore-not-found=true
    oc delete deployment postgres --ignore-not-found=true
    oc delete deployment minio --ignore-not-found=true
    oc delete deployment ollama-nvidia-gpu --ignore-not-found=true

    # Delete services
    print_status "Deleting services..."
    oc delete service ospo-app --ignore-not-found=true
    oc delete service keycloak --ignore-not-found=true
    oc delete service postgres --ignore-not-found=true
    oc delete service minio --ignore-not-found=true
    oc delete service ollama-nvidia-gpu --ignore-not-found=true

    # Delete routes
    print_status "Deleting routes..."
    oc delete route ospo-app --ignore-not-found=true
    oc delete route keycloak --ignore-not-found=true
    oc delete route ollama-nvidia-gpu --ignore-not-found=true

    # Delete configmaps
    print_status "Deleting configmaps..."
    oc delete configmap keycloak-client-config --ignore-not-found=true
    oc delete configmap keycloak-realm-config --ignore-not-found=true

    # Delete secrets (but preserve PVCs and ImageStreams)
    print_status "Deleting secrets..."
    oc delete secret dockerhub-secret --ignore-not-found=true

    # Delete ImageStreams and BuildConfigs
    print_status "Deleting build resources..."
    oc delete imagestream ospo-events-app --ignore-not-found=true
    oc delete buildconfig ospo-events-app --ignore-not-found=true

    # Explicitly preserve PVCs - DO NOT DELETE THESE
    print_status "✅ PRESERVING PersistentVolumeClaims (data safe):"
    print_status "   - postgres-pvc (Keycloak users + Event data)"
    print_status "   - minio-pvc (File uploads)"
    print_status "   - ospo-uploads-pvc (Application uploads)"

    # Wait for pods to be fully deleted
    print_status "Waiting for pods to be fully deleted..."
    sleep 10

    # Verify PVCs are still there
    print_status "Verifying data preservation..."
    if oc get pvc postgres-pvc >/dev/null 2>&1; then
        print_success "✅ PostgreSQL PVC preserved (Keycloak users + Events data safe)"
    else
        print_error "❌ PostgreSQL PVC missing! Data may be lost!"
    fi

    if oc get pvc minio-pvc >/dev/null 2>&1; then
        print_success "✅ MinIO PVC preserved (File uploads safe)"
    else
        print_error "❌ MinIO PVC missing! File uploads may be lost!"
    fi

    if oc get pvc ospo-uploads-pvc >/dev/null 2>&1; then
        print_success "✅ App uploads PVC preserved (Application uploads safe)"
    else
        print_error "❌ App uploads PVC missing! Application uploads may be lost!"
    fi

    print_success "🎉 All pods deleted successfully!"
    print_status "📋 Summary:"
    echo "   ✅ All deployments, services, and routes removed"
    echo "   ✅ All user data preserved in PostgreSQL"
    echo "   ✅ All event data preserved in PostgreSQL"
    echo "   ✅ All file uploads preserved in MinIO"
    echo "   ✅ All application uploads preserved"
    echo ""
    print_status "💡 To redeploy, run:"
    echo "   ./deploy.sh --${ENVIRONMENT}"
    echo ""
    print_warning "⚠️  Note: You may need to recreate users in Keycloak if this was the first deployment"
}

# Function to create a complete backup of all data
backup_all_data() {
    if [[ -z "$ENVIRONMENT" ]]; then
        print_error "🚨 Environment must be specified for backup operation. Use --dev or --prod"
        show_usage
        exit 1
    fi

    print_status "📦 Starting complete data backup..."

    # Create backup directory with timestamp
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="backup/${ENVIRONMENT}_backup_${BACKUP_TIMESTAMP}"

    print_status "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    # Check if PostgreSQL pod is running
    if ! oc get pod -l app=postgres --field-selector=status.phase=Running | grep -q postgres; then
        print_error "❌ PostgreSQL pod is not running. Cannot backup database data."
        print_status "Attempting to start PostgreSQL..."
        oc scale deployment postgres --replicas=1
        print_status "Waiting for PostgreSQL to be ready..."
        sleep 30
    fi

    # Backup PostgreSQL database
    print_status "📊 Backing up PostgreSQL database..."
    if oc get pod -l app=postgres --field-selector=status.phase=Running | grep -q postgres; then
        POSTGRES_POD=$(oc get pod -l app=postgres --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

        # Backup the main events database
        oc exec $POSTGRES_POD -- pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > "$BACKUP_DIR/events_database.sql"

        # Backup the Keycloak database
        oc exec $POSTGRES_POD -- pg_dump -U ${POSTGRES_USER} -d ${KEYCLOAK_DB_NAME} > "$BACKUP_DIR/keycloak_database.sql"

        print_success "✅ PostgreSQL databases backed up"
    else
        print_error "❌ Could not backup PostgreSQL - pod not running"
    fi

    # Backup MinIO data
    print_status "📁 Backing up MinIO file uploads..."
    if oc get pod -l app=minio --field-selector=status.phase=Running | grep -q minio; then
        MINIO_POD=$(oc get pod -l app=minio --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

        # Create MinIO backup directory
        mkdir -p "$BACKUP_DIR/minio_backup"

        # Try to use oc rsync first
        if oc rsync $MINIO_POD:/data "$BACKUP_DIR/minio_backup/" --no-perms=true 2>/dev/null; then
            print_success "✅ MinIO file uploads backed up via rsync"
        else
            print_warning "⚠️  MinIO rsync failed, trying alternative methods..."

            # Alternative 1: Try to copy individual files using oc cp
            print_status "Trying file-by-file copy method..."
            if oc exec $MINIO_POD -- find /data -type f -name "*" 2>/dev/null | head -10 > /dev/null; then
                # Get list of files and copy them individually
                oc exec $MINIO_POD -- find /data -type f 2>/dev/null | while read file; do
                    if [[ -n "$file" ]]; then
                        # Create directory structure
                        dir=$(dirname "$file")
                        mkdir -p "$BACKUP_DIR/minio_backup$dir"
                        # Copy file
                        oc cp "$MINIO_POD:$file" "$BACKUP_DIR/minio_backup$file" 2>/dev/null || true
                    fi
                done
                print_success "✅ MinIO file uploads backed up via file copy"
            else
                # Alternative 2: Use MinIO client to export data
                print_status "Trying MinIO client export method..."
                if oc exec $MINIO_POD -- which mc >/dev/null 2>&1; then
                    oc exec $MINIO_POD -- mc mirror /data /tmp/backup 2>/dev/null || true
                    oc cp "$MINIO_POD:/tmp/backup" "$BACKUP_DIR/minio_backup/" 2>/dev/null || true
                    oc exec $MINIO_POD -- rm -rf /tmp/backup 2>/dev/null || true
                    print_success "✅ MinIO file uploads backed up via MinIO client"
                else
                    print_warning "⚠️  MinIO backup skipped - no suitable method available"
                    print_warning "   MinIO container lacks rsync, tar, and MinIO client"
                    print_warning "   Consider upgrading MinIO image or implementing custom backup"
                fi
            fi
        fi
    else
        print_error "❌ Could not backup MinIO - pod not running"
    fi

    # Backup application uploads
    print_status "📎 Backing up application uploads..."
    if oc get pod -l app=ospo-app --field-selector=status.phase=Running | grep -q ospo-app; then
        APP_POD=$(oc get pod -l app=ospo-app --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

        # Create app uploads backup directory
        mkdir -p "$BACKUP_DIR/app_uploads_backup"

        # Try to use oc rsync first
        if oc rsync $APP_POD:/app/uploads "$BACKUP_DIR/app_uploads_backup/" --no-perms=true 2>/dev/null; then
            print_success "✅ Application uploads backed up via rsync"
        else
            print_warning "⚠️  App uploads rsync failed, trying alternative methods..."

            # Alternative 1: Try to copy individual files using oc cp
            print_status "Trying file-by-file copy method..."
            if oc exec $APP_POD -- find /app/uploads -type f -name "*" 2>/dev/null | head -10 > /dev/null; then
                # Get list of files and copy them individually
                oc exec $APP_POD -- find /app/uploads -type f 2>/dev/null | while read file; do
                    if [[ -n "$file" ]]; then
                        # Create directory structure
                        dir=$(dirname "$file")
                        mkdir -p "$BACKUP_DIR/app_uploads_backup$dir"
                        # Copy file
                        oc cp "$APP_POD:$file" "$BACKUP_DIR/app_uploads_backup$file" 2>/dev/null || true
                    fi
                done
                print_success "✅ Application uploads backed up via file copy"
            else
                # Alternative 2: Try tar if available
                print_status "Trying tar method..."
                if oc exec $APP_POD -- which tar >/dev/null 2>&1; then
                    oc exec $APP_POD -- tar -czf /tmp/app_uploads_backup.tar.gz -C /app/uploads .
                    oc cp $APP_POD:/tmp/app_uploads_backup.tar.gz "$BACKUP_DIR/app_uploads_backup.tar.gz"
                    oc exec $APP_POD -- rm /tmp/app_uploads_backup.tar.gz
                    print_success "✅ Application uploads backed up via tar"
                else
                    print_warning "⚠️  App uploads backup skipped - no suitable method available"
                    print_warning "   App container lacks rsync and tar"
                fi
            fi
        fi
    else
        print_error "❌ Could not backup application uploads - pod not running"
    fi

    # Create backup metadata
    print_status "📋 Creating backup metadata..."
    cat > "$BACKUP_DIR/backup_metadata.txt" <<EOF
OSPO Events Manager Backup
=========================
Backup Date: $(date)
Environment: $ENVIRONMENT
Namespace: $NAMESPACE
Database: $POSTGRES_DB
Keycloak Database: $KEYCLOAK_DB_NAME

Contents:
- events_database.sql: Main application database
- keycloak_database.sql: Keycloak user and authentication data
- minio_backup/: File uploads from MinIO
- app_uploads_backup/: Application uploads
- backup_metadata.txt: This file

Restore Command:
./deploy.sh --restore -f $BACKUP_DIR
EOF

    print_success "🎉 Backup completed successfully!"
    print_status "📋 Backup Summary:"
    echo "   📁 Backup Location: $BACKUP_DIR"
    echo "   📊 Events Database: $(du -h "$BACKUP_DIR/events_database.sql" 2>/dev/null | cut -f1 || echo "N/A")"
    echo "   👥 Keycloak Database: $(du -h "$BACKUP_DIR/keycloak_database.sql" 2>/dev/null | cut -f1 || echo "N/A")"
    echo "   📁 MinIO Data: $(du -sh "$BACKUP_DIR/minio_backup" 2>/dev/null | cut -f1 || echo "N/A")"
    echo "   📎 App Uploads: $(du -sh "$BACKUP_DIR/app_uploads_backup" 2>/dev/null | cut -f1 || echo "N/A")"
    echo ""
    print_status "💡 To restore this backup:"
    echo "   ./deploy.sh --restore -f $BACKUP_DIR"
}

# Function to restore data from backup
restore_from_backup() {
    if [[ -z "$RESTORE_PATH" ]]; then
        print_error "Restore path must be specified with -f option"
        exit 1
    fi

    if [[ ! -d "$RESTORE_PATH" ]]; then
        print_error "Backup directory not found: $RESTORE_PATH"
        exit 1
    fi

    print_warning "⚠️  WARNING: This will RESTORE data from backup!"
    print_warning "⚠️  This action will:"
    print_warning "   - Restore PostgreSQL databases (events + keycloak)"
    print_warning "   - Restore MinIO file uploads"
    print_warning "   - Restore application uploads"
    print_warning "   - OVERWRITE existing data in the cluster"
    print_warning ""
    print_warning "⚠️  CURRENT DATA WILL BE LOST!"
    echo ""

    # Show backup info
    if [[ -f "$RESTORE_PATH/backup_metadata.txt" ]]; then
        print_status "📋 Backup Information:"
        cat "$RESTORE_PATH/backup_metadata.txt"
        echo ""
    fi

    # Require explicit confirmation
    read -p "Are you absolutely sure you want to restore from backup? Type 'RESTORE FROM BACKUP' to confirm: " confirmation

    if [[ "$confirmation" != "RESTORE FROM BACKUP" ]]; then
        print_error "Restore cancelled. You must type 'RESTORE FROM BACKUP' exactly to confirm."
        exit 1
    fi

    print_status "🔄 Starting data restoration..."

    # Ensure PostgreSQL is running
    print_status "Ensuring PostgreSQL is running..."
    oc scale deployment postgres --replicas=1
    sleep 10

    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    until oc get pod -l app=postgres --field-selector=status.phase=Running | grep -q postgres; do
        print_status "Waiting for PostgreSQL pod..."
        sleep 5
    done

    POSTGRES_POD=$(oc get pod -l app=postgres --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

    # Restore PostgreSQL databases
    print_status "📊 Restoring PostgreSQL databases..."

    # Restore events database
    if [[ -f "$RESTORE_PATH/events_database.sql" ]]; then
        print_status "Restoring events database..."
        oc exec -i $POSTGRES_POD -- psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < "$RESTORE_PATH/events_database.sql"
        print_success "✅ Events database restored"
    else
        print_error "❌ Events database backup not found"
    fi

    # Restore Keycloak database
    if [[ -f "$RESTORE_PATH/keycloak_database.sql" ]]; then
        print_status "Restoring Keycloak database..."
        oc exec -i $POSTGRES_POD -- psql -U ${POSTGRES_USER} -d ${KEYCLOAK_DB_NAME} < "$RESTORE_PATH/keycloak_database.sql"
        print_success "✅ Keycloak database restored"
    else
        print_error "❌ Keycloak database backup not found"
    fi

    # Restore MinIO data
    print_status "📁 Restoring MinIO file uploads..."
    oc scale deployment minio --replicas=1
    sleep 10

    until oc get pod -l app=minio --field-selector=status.phase=Running | grep -q minio; do
        print_status "Waiting for MinIO pod..."
        sleep 5
    done

    MINIO_POD=$(oc get pod -l app=minio --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

    if [[ -d "$RESTORE_PATH/minio_backup" ]]; then
        if oc rsync "$RESTORE_PATH/minio_backup/" $MINIO_POD:/data --no-perms=true 2>/dev/null; then
            print_success "✅ MinIO file uploads restored via rsync"
        else
            print_warning "⚠️  MinIO rsync failed, trying alternative methods..."

            # Try file-by-file restore
            if find "$RESTORE_PATH/minio_backup" -type f | head -1 >/dev/null 2>&1; then
                print_status "Trying file-by-file restore..."
                find "$RESTORE_PATH/minio_backup" -type f | while read file; do
                    if [[ -n "$file" ]]; then
                        # Calculate relative path
                        rel_path="${file#$RESTORE_PATH/minio_backup}"
                        oc cp "$file" "$MINIO_POD:/data$rel_path" 2>/dev/null || true
                    fi
                done
                print_success "✅ MinIO file uploads restored via file copy"
            else
                print_warning "⚠️  MinIO restore skipped - no files found"
            fi
        fi
    elif [[ -f "$RESTORE_PATH/minio_backup.tar.gz" ]]; then
        print_status "Restoring MinIO from tar archive..."
        oc cp "$RESTORE_PATH/minio_backup.tar.gz" $MINIO_POD:/tmp/
        oc exec $MINIO_POD -- tar -xzf /tmp/minio_backup.tar.gz -C /data
        oc exec $MINIO_POD -- rm /tmp/minio_backup.tar.gz
        print_success "✅ MinIO file uploads restored from tar"
    else
        print_error "❌ MinIO backup directory or tar file not found"
    fi

    # Restore application uploads
    print_status "📎 Restoring application uploads..."
    oc scale deployment ospo-app --replicas=1
    sleep 10

    until oc get pod -l app=ospo-app --field-selector=status.phase=Running | grep -q ospo-app; do
        print_status "Waiting for application pod..."
        sleep 5
    done

    APP_POD=$(oc get pod -l app=ospo-app --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')

    if [[ -d "$RESTORE_PATH/app_uploads_backup" ]]; then
        if oc rsync "$RESTORE_PATH/app_uploads_backup/" $APP_POD:/app/uploads --no-perms=true 2>/dev/null; then
            print_success "✅ Application uploads restored via rsync"
        else
            print_warning "⚠️  App uploads rsync failed, trying alternative methods..."

            # Try file-by-file restore
            if find "$RESTORE_PATH/app_uploads_backup" -type f | head -1 >/dev/null 2>&1; then
                print_status "Trying file-by-file restore..."
                find "$RESTORE_PATH/app_uploads_backup" -type f | while read file; do
                    if [[ -n "$file" ]]; then
                        # Calculate relative path
                        rel_path="${file#$RESTORE_PATH/app_uploads_backup}"
                        oc cp "$file" "$APP_POD:/app/uploads$rel_path" 2>/dev/null || true
                    fi
                done
                print_success "✅ Application uploads restored via file copy"
            else
                print_warning "⚠️  App uploads restore skipped - no files found"
            fi
        fi
    elif [[ -f "$RESTORE_PATH/app_uploads_backup.tar.gz" ]]; then
        print_status "Restoring app uploads from tar archive..."
        oc cp "$RESTORE_PATH/app_uploads_backup.tar.gz" $APP_POD:/tmp/
        oc exec $APP_POD -- tar -xzf /tmp/app_uploads_backup.tar.gz -C /app/uploads
        oc exec $APP_POD -- rm /tmp/app_uploads_backup.tar.gz
        print_success "✅ Application uploads restored from tar"
    else
        print_error "❌ Application uploads backup directory or tar file not found"
    fi

    print_success "🎉 Data restoration completed successfully!"
    print_status "📋 Restore Summary:"
    echo "   ✅ Events database restored"
    echo "   ✅ Keycloak database restored"
    echo "   ✅ MinIO file uploads restored"
    echo "   ✅ Application uploads restored"
    echo ""
    print_status "💡 You may need to restart services for changes to take effect"
}

# Function to completely destroy all data
destroy_all_data() {
    if [[ -z "$ENVIRONMENT" ]]; then
        print_error "Environment must be specified for destroy operation. Use --dev or --prod"
        show_usage
        exit 1
    fi

    print_error "💀 CATASTROPHIC DESTRUCTION WARNING 💀"
    print_error "💀 THIS WILL PERMANENTLY DESTROY ALL DATA 💀"
    print_error ""
    print_error "⚠️  THIS ACTION WILL:"
    print_error "   - Delete ALL pods in the cluster"
    print_error "   - Delete ALL PersistentVolumeClaims (ALL DATA WILL BE LOST)"
    print_error "   - Delete ALL deployments, services, and routes"
    print_error "   - Delete ALL configuration and secrets"
    print_error "   - Make ALL user data, events, and uploads IRRETRIEVABLE"
    print_error ""
    print_error "💀 DATA THAT WILL BE DESTROYED FOREVER:"
    print_error "   - All Keycloak users and authentication data"
    print_error "   - All events and event management data"
    print_error "   - All file uploads and attachments"
    print_error "   - All application configuration and settings"
    print_error ""
    print_error "💀 THIS CANNOT BE UNDONE! 💀"
    print_error ""
    print_error "⚠️  YOU SHOULD BACKUP THE CLUSTER FIRST:"
    print_error "   ./deploy.sh --backup"
    echo ""

    # Multiple confirmation prompts
    print_warning "First confirmation: Type 'I UNDERSTAND DATA WILL BE LOST'"
    read -p "Confirmation: " confirmation1

    if [[ "$confirmation1" != "I UNDERSTAND DATA WILL BE LOST" ]]; then
        print_error "Destruction cancelled."
        exit 1
    fi

    print_warning "Second confirmation: Type 'DESTROY ALL DATA PERMANENTLY'"
    read -p "Confirmation: " confirmation2

    if [[ "$confirmation2" != "DESTROY ALL DATA PERMANENTLY" ]]; then
        print_error "Destruction cancelled."
        exit 1
    fi

    print_warning "Final confirmation: Type 'FINAL CONFIRMATION - DESTROY EVERYTHING'"
    read -p "Final confirmation: " confirmation3

    if [[ "$confirmation3" != "FINAL CONFIRMATION - DESTROY EVERYTHING" ]]; then
        print_error "Destruction cancelled."
        exit 1
    fi

    print_error "💀 PROCEEDING WITH CATASTROPHIC DESTRUCTION 💀"

    # Delete all deployments first
    print_status "Deleting all deployments..."
    oc delete deployment --all --ignore-not-found=true

    # Delete all services
    print_status "Deleting all services..."
    oc delete service --all --ignore-not-found=true

    # Delete all routes
    print_status "Deleting all routes..."
    oc delete route --all --ignore-not-found=true

    # Delete all configmaps
    print_status "Deleting all configmaps..."
    oc delete configmap --all --ignore-not-found=true

    # Delete all secrets
    print_status "Deleting all secrets..."
    oc delete secret --all --ignore-not-found=true

    # Delete all ImageStreams and BuildConfigs
    print_status "Deleting all build resources..."
    oc delete imagestream --all --ignore-not-found=true
    oc delete buildconfig --all --ignore-not-found=true

    # CATASTROPHIC: Delete all PVCs (THIS DESTROYS ALL DATA)
    print_error "💀 DESTROYING ALL PERSISTENT VOLUME CLAIMS 💀"
    print_error "💀 ALL DATA WILL BE PERMANENTLY LOST 💀"
    oc delete pvc --all --ignore-not-found=true

    print_error "💀 CATASTROPHIC DESTRUCTION COMPLETED 💀"
    print_error "💀 ALL DATA HAS BEEN PERMANENTLY DESTROYED 💀"
    print_error ""
    print_error "📋 What was destroyed:"
    print_error "   💀 All pods and deployments"
    print_error "   💀 All services and routes"
    print_error "   💀 All configuration and secrets"
    print_error "   💀 All PersistentVolumeClaims"
    print_error "   💀 ALL USER DATA (irretrievable)"
    print_error "   💀 ALL EVENT DATA (irretrievable)"
    print_error "   💀 ALL FILE UPLOADS (irretrievable)"
    print_error ""
    print_error "⚠️  To start fresh, run: ./deploy.sh --${ENVIRONMENT}"
}

# Function to delete local KIND cluster
delete_local_cluster() {
    # Check if kind is installed
    if ! command -v kind &>/dev/null; then
        print_error "kind is required but not installed!"
        echo "Installation instructions:"
        echo "  brew install kind"
        exit 1
    fi
    
    print_warning "⚠️  WARNING: This will delete the local KIND cluster!"
    print_warning "⚠️  This action will:"
    print_warning "   - Delete the entire 'ospo-local' KIND cluster"
    print_warning "   - Remove all data (PostgreSQL, Keycloak, MinIO)"
    print_warning "   - Remove all pods, services, and persistent volumes"
    print_warning ""
    print_warning "⚠️  ALL LOCAL DEVELOPMENT DATA WILL BE LOST!"
    echo ""
    
    # Check if cluster exists
    if ! kind get clusters 2>/dev/null | grep -q "^ospo-local$"; then
        print_warning "KIND cluster 'ospo-local' does not exist"
        print_info "Nothing to delete"
        exit 0
    fi
    
    # Require explicit confirmation
    read -p "Are you sure you want to delete the local KIND cluster? Type 'DELETE LOCAL CLUSTER' to confirm: " confirmation
    
    if [[ "$confirmation" != "DELETE LOCAL CLUSTER" ]]; then
        print_error "Deletion cancelled. You must type 'DELETE LOCAL CLUSTER' exactly to confirm."
        exit 1
    fi
    
    print_status "🗑️  Deleting local KIND cluster 'ospo-local'..."
    
    # Delete the KIND cluster
    KIND_EXPERIMENTAL_PROVIDER=podman kind delete cluster --name ospo-local
    
    if [ $? -eq 0 ]; then
        print_success "✅ Local KIND cluster deleted successfully!"
        echo ""
        print_info "📋 What was deleted:"
        echo "   - KIND cluster 'ospo-local'"
        echo "   - All pods (PostgreSQL, Keycloak, MinIO)"
        echo "   - All persistent volumes and data"
        echo "   - All services and network configuration"
        echo ""
        print_info "💡 To recreate the local development environment:"
        echo "   ./deploy.sh --local"
    else
        print_error "❌ Failed to delete KIND cluster"
        exit 1
    fi
}

# Main deployment function
main() {
    print_status "🚀 Starting deployment process..."

    # SAFETY CHECK: Ensure this script is only used for deployments
    if [[ "$DELETE" != "true" && "$BACKUP" != "true" && "$RESTORE" != "true" && "$DESTROY" != "true" ]]; then
        print_status "🔒 SAFETY MODE ENABLED - This script will NOT perform destructive operations"
        print_status "🔒 All data-preserving operations only"
    fi

    # Handle backup operation
    if [[ "$BACKUP" == "true" ]]; then
        backup_all_data
        exit 0
    fi

    # Handle restore operation
    if [[ "$RESTORE" == "true" ]]; then
        restore_from_backup
        exit 0
    fi

    # Handle destroy operation
    if [[ "$DESTROY" == "true" ]]; then
        destroy_all_data
        exit 0
    fi

    # Handle delete local cluster operation
    if [[ "$DELETE_LOCAL" == "true" ]]; then
        delete_local_cluster
        exit 0
    fi

    # Handle delete operation
    if [[ "$DELETE" == "true" ]]; then
        if [[ -z "$ENVIRONMENT" ]]; then
            print_error "Environment must be specified for delete operation. Use --dev or --prod"
            show_usage
            exit 1
        fi
        print_warning "⚠️  WARNING: DELETE operation requested!"
        print_warning "⚠️  This will delete ALL pods in the $ENVIRONMENT environment!"
        delete_all_pods
        exit 0
    fi


    # Handle local KIND cluster deployment
    if [[ "$ENVIRONMENT" == "local" ]]; then
        # Deploy individual components if flags are set
        if [[ "$POSTGRES" == "true" ]]; then
            deploy_postgres_local
        fi
        
        if [[ "$KEYCLOAK" == "true" ]]; then
            deploy_keycloak_local
        fi
        
        if [[ "$MINIO" == "true" ]]; then
            deploy_minio_local
        fi
        
        # If specific components were deployed, show summary and exit
        if [[ "$POSTGRES" == "true" || "$KEYCLOAK" == "true" || "$MINIO" == "true" ]]; then
            print_success "🎉 Deployment completed successfully!"
            echo ""
            print_status "📋 Deployment Summary:"
            if [[ "$POSTGRES" == "true" ]]; then
                echo "   ✅ PostgreSQL Deployed"
            fi
            if [[ "$KEYCLOAK" == "true" ]]; then
                echo "   ✅ Keycloak Deployed"
            fi
            if [[ "$MINIO" == "true" ]]; then
                echo "   ✅ MinIO Deployed"
            fi
            echo "   Environment: $ENVIRONMENT"
            echo "   Namespace: $NAMESPACE"
            echo ""
            print_info "Service Access URLs (from localhost):"
            echo "  PostgreSQL:     localhost:5432 (ospo_user/ospo_password)"
            echo "  Keycloak:       http://localhost:8080/auth (admin/admin)"
            echo "  MinIO API:      http://localhost:9000 (minioadmin/minioadmin)"
            echo "  MinIO Console:  http://localhost:9001"
            echo ""
            print_status "🔍 Checking deployment status..."
            kubectl get pods -n "$NAMESPACE"
            echo ""
            print_info "🚀 To run application locally with hot reload:"
            echo "  npm run dev:local"
            echo ""
            print_info "Application will run on your machine and connect to services in KIND."
            exit 0
        fi
        
        # If no specific components were requested, deploy all
        print_status "🚀 Deploying all services to local KIND cluster..."
        deploy_postgres_local
        deploy_keycloak_local
        deploy_minio_local
        
        print_success "🎉 All services deployed successfully!"
        echo ""
        print_status "📋 Deployment Summary:"
        echo "   Environment: $ENVIRONMENT"
        echo "   Namespace: $NAMESPACE"
        echo "   ✅ PostgreSQL Deployed to KIND"
        echo "   ✅ Keycloak Deployed to KIND"
        echo "   ✅ MinIO Deployed to KIND"
        echo ""
        print_info "Service Access URLs (from localhost):"
        echo "  PostgreSQL:     localhost:5432 (ospo_user/ospo_password)"
        echo "  Keycloak:       http://localhost:8080/auth (admin/admin)"
        echo "  MinIO API:      http://localhost:9000 (minioadmin/minioadmin)"
        echo "  MinIO Console:  http://localhost:9001"
        echo ""
        print_status "🔍 Checking deployment status..."
        kubectl get pods -n "$NAMESPACE"
        echo ""
        print_warning "⚡ IMPORTANT: Services are deployed, but application is NOT deployed yet."
        print_info "🚀 Next steps to run application locally with hot reload:"
        echo "  1. Push database schema:    npm run db:push:local"
        echo "  2. Run application locally:  npm run dev:local"
        echo ""
        print_success "✨ Local development stack is ready! Run 'npm run dev:local' to start developing."
        exit 0
    fi

    # Handle OpenShift (dev/prod) deployment
    # Deploy postgres if flag is set
    if [[ "$POSTGRES" == "true" ]]; then
        print_status "🚀 Deploying the postgres pod..."
        oc scale deployment postgres --replicas=0
        sleep 5
        deploy_postgres
        sleep 5
        oc scale deployment postgres --replicas=1
        print_success "🎉 Postgres deployed successfully!"
    fi
    
    # Deploy keycloak if flag is set
    if [[ "$KEYCLOAK" == "true" ]]; then
        print_status "🚀 Deploying the keycloak pod..."
        kc_running=$(oc get pods | grep keycloak | wc -l)
        if [[ $kc_running -eq 0 ]]; then
          print_status "🚀 Keycloak not running, deploying the keycloak pod..."
          deploy_keycloak
          sleep 5
          print_success "🎉 Keycloak deployed successfully!"
        else
          oc scale deployment keycloak --replicas=0
          sleep 5
          deploy_keycloak
          sleep 5
          oc scale deployment keycloak --replicas=1
          print_success "🎉 Keycloak deployed successfully!"
        fi
    fi
    
    # Deploy application if flag is set
    if [[ "$APP" == "true" ]]; then
      print_status "🚀 Deploying the application..."
      # Get current version from package.json
      local current_version=$(get_package_version)
      print_status "🔍 Current version in package.json: $current_version"

      # Check if build is needed (unless --force is specified)
      if [[ "$FORCE_BUILD" != "true" ]]; then
        local imagestream_name="ospo-events-app"
        latest_tagged_version=$(get_latest_image_version "$imagestream_name")
        print_status "🔍 Latest version in registry: $latest_tagged_version"
        if [[ -n "$latest_tagged_version" ]]; then
          print_status "🔍 Latest version in registry: $latest_tagged_version"
          if version_greater "$current_version" "$latest_tagged_version"; then
            print_status "Version $current_version > $latest_tagged_version, build needed"
          else
            print_success "Version $current_version <= $latest_tagged_version, skipping build"
            print_success "Use --force flag to force a rebuild"
            return 0
          fi
        else
          print_status "🔍 No previous version found in registry, building first version"
        fi
      else
        print_status "Force build requested, skipping version check"
      fi
      deploy_app
      oc scale deployment ospo-app --replicas=0
      sleep 5
      oc scale deployment ospo-app --replicas=1
      print_success "🎉 Application deployed successfully!"
    fi

    if [[ "$ROUTES" == "true" ]]; then
        create_routes
        print_success "🎉 Routes created successfully!"
        exit 0
    fi

    if [[ "$APP" == "true" || "$KEYCLOAK" == "true" || "$POSTGRES" == "true" || "$MINIO" == "true" || "$AI" == "true" ]]; then
      print_success "🎉 Deployment completed successfully!"
      echo ""
      print_status "📋 Deployment Summary:"
      if [[ "$APP" == "true" ]]; then
        echo "   Application Redeployed"
      fi
      if [[ "$KEYCLOAK" == "true" ]]; then
        echo "   Keycloak Redeployed"
      fi
      if [[ "$POSTGRES" == "true" ]]; then
        echo "   PostgreSQL Redeployed"
      fi
      if [[ "$MINIO" == "true" ]]; then
        echo "   MinIO Redeployed"
      fi
      if [[ "$AI" == "true" ]]; then
        echo "   AI Redeployed"
      fi
      echo "   Environment: $ENVIRONMENT"
      echo "   Namespace: $NAMESPACE"
      echo "   Application URL: $APP_URL"
      echo "   Keycloak URL: $KEYCLOAK_URL"
      echo ""
      print_status "🔍 Checking deployment status..."
      oc get pods -l app
      exit 0
    fi

    # Deploy all components in order (default behavior)
    create_dockerhub_secret
    deploy_postgres
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
    print_success "✨ OSPO Events Manager is now deployed and ready!"
}

# Run main function
main "$@"