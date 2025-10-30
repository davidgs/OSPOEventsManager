#!/bin/bash

# OSPO Events Manager - KIND Cluster Setup Script
# This script manages a local KIND (Kubernetes in Docker) cluster for development
# Uses Podman as the container runtime

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="ospo-local"
NAMESPACE="ospo-local"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists kind; then
        missing_deps+=("kind")
    fi
    
    if ! command_exists kubectl; then
        missing_deps+=("kubectl")
    fi
    
    if ! command_exists podman; then
        missing_deps+=("podman")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        echo "Installation instructions:"
        echo "  - kind:    brew install kind"
        echo "  - kubectl: brew install kubectl"
        echo "  - podman:  brew install podman"
        echo ""
        echo "For more information:"
        echo "  - KIND: https://kind.sigs.k8s.io/docs/user/quick-start/"
        echo "  - kubectl: https://kubernetes.io/docs/tasks/tools/"
        echo "  - Podman: https://podman.io/getting-started/installation"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to check if Podman machine is running
check_podman_machine() {
    print_info "Checking Podman machine status..."
    
    if ! podman machine list | grep -q "Currently running"; then
        print_warning "Podman machine is not running. Starting it now..."
        podman machine start || {
            print_error "Failed to start Podman machine"
            print_info "Try initializing Podman: podman machine init"
            exit 1
        }
        print_success "Podman machine started"
        # Give Podman a moment to stabilize
        sleep 5
    else
        print_success "Podman machine is running"
    fi
}

# Function to create KIND cluster
create_cluster() {
    print_info "Creating KIND cluster '${CLUSTER_NAME}'..."
    
    # Check if cluster already exists
    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        print_warning "Cluster '${CLUSTER_NAME}' already exists"
        read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            delete_cluster
        else
            print_info "Using existing cluster"
            return 0
        fi
    fi
    
    # Create KIND cluster with Podman provider
    # Note: We expose ports for services to be accessible from host
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
    print_info "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=120s
    print_success "Cluster is ready"
}

# Function to create namespace
create_namespace() {
    print_info "Creating namespace '${NAMESPACE}'..."
    kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"
    print_success "Namespace created"
}

# Function to load Keycloak realm configuration
load_keycloak_config() {
    print_info "Loading Keycloak realm configuration..."
    
    local realm_file="${PROJECT_ROOT}/keycloak-realm-export.json"
    
    if [ ! -f "$realm_file" ]; then
        print_warning "Keycloak realm export file not found at: $realm_file"
        print_info "Keycloak will start without a preconfigured realm"
        print_info "You'll need to manually configure the realm after deployment"
        return 0
    fi
    
    # Create ConfigMap from realm file
    kubectl create configmap keycloak-realm-config \
        --from-file=realm.json="$realm_file" \
        --namespace="${NAMESPACE}" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "Keycloak realm configuration loaded"
}

# Function to deploy services
deploy_services() {
    print_info "Deploying services to KIND cluster..."
    
    # Deploy in order: PostgreSQL -> Keycloak -> MinIO
    print_info "Deploying PostgreSQL..."
    kubectl apply -f "${SCRIPT_DIR}/postgres.yaml"
    
    print_info "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=Ready pod -l app=postgres -n "${NAMESPACE}" --timeout=180s || {
        print_warning "PostgreSQL pod didn't become ready in time. Checking status..."
        kubectl get pods -n "${NAMESPACE}" -l app=postgres
        kubectl describe pod -n "${NAMESPACE}" -l app=postgres
    }
    
    print_info "Deploying Keycloak..."
    kubectl apply -f "${SCRIPT_DIR}/keycloak.yaml"
    
    print_info "Waiting for Keycloak to be ready (this may take a few minutes)..."
    kubectl wait --for=condition=Ready pod -l app=keycloak -n "${NAMESPACE}" --timeout=300s || {
        print_warning "Keycloak pod didn't become ready in time. Checking status..."
        kubectl get pods -n "${NAMESPACE}" -l app=keycloak
        kubectl describe pod -n "${NAMESPACE}" -l app=keycloak
    }
    
    print_info "Deploying MinIO..."
    kubectl apply -f "${SCRIPT_DIR}/minio.yaml"
    
    print_info "Waiting for MinIO to be ready..."
    kubectl wait --for=condition=Ready pod -l app=minio -n "${NAMESPACE}" --timeout=180s || {
        print_warning "MinIO pod didn't become ready in time. Checking status..."
        kubectl get pods -n "${NAMESPACE}" -l app=minio
        kubectl describe pod -n "${NAMESPACE}" -l app=minio
    }
    
    print_success "All services deployed"
}

# Function to create NodePort services for external access
create_nodeport_services() {
    print_info "Creating NodePort services for external access..."
    
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

# Function to show status
show_status() {
    print_info "Cluster Status:"
    echo ""
    
    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        print_warning "Cluster '${CLUSTER_NAME}' does not exist"
        return 0
    fi
    
    print_info "Cluster: ${CLUSTER_NAME}"
    kubectl cluster-info --context "kind-${CLUSTER_NAME}" | head -n 1
    
    echo ""
    print_info "Pods:"
    kubectl get pods -n "${NAMESPACE}" 2>/dev/null || print_warning "Namespace '${NAMESPACE}' not found"
    
    echo ""
    print_info "Services:"
    kubectl get svc -n "${NAMESPACE}" 2>/dev/null || print_warning "Namespace '${NAMESPACE}' not found"
    
    echo ""
    print_info "Service Access URLs:"
    echo "  PostgreSQL:     localhost:5432 (ospo_user/ospo_password)"
    echo "  Keycloak:       http://localhost:8080/auth (admin/admin)"
    echo "  MinIO API:      http://localhost:9000 (minioadmin/minioadmin)"
    echo "  MinIO Console:  http://localhost:9001 (minioadmin/minioadmin)"
    echo ""
    print_info "Next steps:"
    echo "  1. Verify all pods are running: kubectl get pods -n ${NAMESPACE}"
    echo "  2. Set up local environment: cp env.local.template .env.local"
    echo "  3. Push database schema: npm run db:push:local"
    echo "  4. Run the application: npm run dev:local"
}

# Function to delete cluster
delete_cluster() {
    print_info "Deleting KIND cluster '${CLUSTER_NAME}'..."
    
    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        print_warning "Cluster '${CLUSTER_NAME}' does not exist"
        return 0
    fi
    
    KIND_EXPERIMENTAL_PROVIDER=podman kind delete cluster --name "${CLUSTER_NAME}"
    print_success "Cluster deleted"
}

# Function to start cluster (if stopped)
start_cluster() {
    check_podman_machine
    
    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        print_warning "Cluster does not exist. Creating it..."
        create_cluster
        create_namespace
        load_keycloak_config
        deploy_services
        create_nodeport_services
    else
        print_success "Cluster '${CLUSTER_NAME}' exists"
    fi
    
    show_status
}

# Function to stop cluster
stop_cluster() {
    print_warning "KIND clusters cannot be stopped individually"
    print_info "You can either:"
    echo "  1. Delete the cluster: $0 delete"
    echo "  2. Stop Podman machine: podman machine stop"
}

# Function to show logs
show_logs() {
    local service="$1"
    
    if [ -z "$service" ]; then
        print_error "Please specify a service: postgres, keycloak, or minio"
        exit 1
    fi
    
    print_info "Showing logs for ${service}..."
    kubectl logs -n "${NAMESPACE}" -l "app=${service}" --tail=100 -f
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    kubectl rollout restart deployment -n "${NAMESPACE}"
    print_success "Services restart initiated"
}

# Main script
main() {
    local command="${1:-help}"
    
    case "$command" in
        start)
            check_prerequisites
            start_cluster
            ;;
        stop)
            stop_cluster
            ;;
        restart)
            check_prerequisites
            print_info "Restarting cluster..."
            delete_cluster
            start_cluster
            ;;
        delete)
            delete_cluster
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        restart-services)
            restart_services
            ;;
        help|*)
            echo "OSPO Events Manager - KIND Cluster Management"
            echo ""
            echo "Usage: $0 {start|stop|restart|delete|status|logs|restart-services|help}"
            echo ""
            echo "Commands:"
            echo "  start             - Create and start the KIND cluster with all services"
            echo "  stop              - Show instructions to stop the cluster"
            echo "  restart           - Delete and recreate the cluster"
            echo "  delete            - Delete the KIND cluster"
            echo "  status            - Show cluster and pod status"
            echo "  logs <service>    - Show logs for a service (postgres|keycloak|minio)"
            echo "  restart-services  - Restart all services (without recreating cluster)"
            echo "  help              - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 start                    # Create and start cluster"
            echo "  $0 status                   # Check cluster status"
            echo "  $0 logs postgres            # View PostgreSQL logs"
            echo "  $0 restart-services         # Restart all services"
            echo "  $0 delete                   # Delete cluster"
            ;;
    esac
}

# Run main function
main "$@"


