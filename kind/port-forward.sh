#!/bin/bash

# OSPO Events Manager - Port Forwarding Script
# This script manages port-forwarding from KIND cluster to localhost
# Allows local application to connect to services running in KIND

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="ospo-local"
PID_DIR="/tmp/ospo-kind-port-forwards"

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

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl >/dev/null 2>&1; then
        print_error "kubectl is not installed"
        exit 1
    fi
}

# Function to check if cluster is running
check_cluster() {
    if ! kubectl cluster-info &>/dev/null; then
        print_error "KIND cluster is not running"
        print_info "Start the cluster with: ./kind/setup-kind.sh start"
        exit 1
    fi
}

# Function to wait for pod to be ready
wait_for_pod() {
    local label="$1"
    local name="$2"
    local timeout=60
    
    print_info "Waiting for ${name} pod to be ready..."
    
    if kubectl wait --for=condition=Ready pod -l "${label}" -n "${NAMESPACE}" --timeout="${timeout}s" &>/dev/null; then
        print_success "${name} pod is ready"
        return 0
    else
        print_warning "${name} pod is not ready yet"
        return 1
    fi
}

# Function to start port forwarding for a service
start_port_forward() {
    local service_name="$1"
    local label="$2"
    local local_port="$3"
    local remote_port="$4"
    local display_name="$5"
    
    # Check if port-forward is already running
    if [ -f "${PID_DIR}/${service_name}.pid" ]; then
        local pid=$(cat "${PID_DIR}/${service_name}.pid")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_warning "${display_name} port-forward is already running (PID: ${pid})"
            return 0
        fi
    fi
    
    # Wait for pod to be ready
    if ! wait_for_pod "${label}" "${display_name}"; then
        print_error "Cannot start port-forward for ${display_name} - pod not ready"
        return 1
    fi
    
    # Get pod name
    local pod_name=$(kubectl get pod -n "${NAMESPACE}" -l "${label}" -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$pod_name" ]; then
        print_error "No pod found for ${display_name}"
        return 1
    fi
    
    print_info "Starting port-forward for ${display_name}: localhost:${local_port} -> ${pod_name}:${remote_port}"
    
    # Start port-forward in background
    kubectl port-forward -n "${NAMESPACE}" "pod/${pod_name}" "${local_port}:${remote_port}" > "${PID_DIR}/${service_name}.log" 2>&1 &
    local pid=$!
    
    # Save PID
    echo "$pid" > "${PID_DIR}/${service_name}.pid"
    
    # Wait a moment and check if it's still running
    sleep 2
    if ps -p "$pid" > /dev/null 2>&1; then
        print_success "${display_name} port-forward started (PID: ${pid})"
        return 0
    else
        print_error "${display_name} port-forward failed to start"
        cat "${PID_DIR}/${service_name}.log"
        return 1
    fi
}

# Function to stop port forwarding for a service
stop_port_forward() {
    local service_name="$1"
    local display_name="$2"
    
    if [ ! -f "${PID_DIR}/${service_name}.pid" ]; then
        print_info "${display_name} port-forward is not running"
        return 0
    fi
    
    local pid=$(cat "${PID_DIR}/${service_name}.pid")
    
    if ps -p "$pid" > /dev/null 2>&1; then
        print_info "Stopping ${display_name} port-forward (PID: ${pid})..."
        kill "$pid" 2>/dev/null || true
        # Wait for process to die
        for i in {1..10}; do
            if ! ps -p "$pid" > /dev/null 2>&1; then
                break
            fi
            sleep 0.5
        done
        # Force kill if still running
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        print_success "${display_name} port-forward stopped"
    else
        print_info "${display_name} port-forward was not running"
    fi
    
    rm -f "${PID_DIR}/${service_name}.pid"
    rm -f "${PID_DIR}/${service_name}.log"
}

# Function to start all port forwards
start_all() {
    print_info "Starting all port-forwards..."
    
    # Create PID directory if it doesn't exist
    mkdir -p "${PID_DIR}"
    
    # Start port-forwards for each service
    start_port_forward "postgres" "app=postgres" "5432" "5432" "PostgreSQL"
    start_port_forward "keycloak" "app=keycloak" "8080" "8080" "Keycloak"
    start_port_forward "minio-api" "app=minio" "9000" "9000" "MinIO API"
    start_port_forward "minio-console" "app=minio" "9001" "9001" "MinIO Console"
    
    echo ""
    print_success "All port-forwards started"
    echo ""
    show_status
}

# Function to stop all port forwards
stop_all() {
    print_info "Stopping all port-forwards..."
    
    stop_port_forward "postgres" "PostgreSQL"
    stop_port_forward "keycloak" "Keycloak"
    stop_port_forward "minio-api" "MinIO API"
    stop_port_forward "minio-console" "MinIO Console"
    
    print_success "All port-forwards stopped"
}

# Function to restart all port forwards
restart_all() {
    print_info "Restarting all port-forwards..."
    stop_all
    sleep 2
    start_all
}

# Function to show status
show_status() {
    print_info "Port-forward Status:"
    echo ""
    
    local services=("postgres:PostgreSQL" "keycloak:Keycloak" "minio-api:MinIO API" "minio-console:MinIO Console")
    local ports=("5432" "8080" "9000" "9001")
    
    for i in "${!services[@]}"; do
        IFS=':' read -r service_name display_name <<< "${services[$i]}"
        local port="${ports[$i]}"
        
        if [ -f "${PID_DIR}/${service_name}.pid" ]; then
            local pid=$(cat "${PID_DIR}/${service_name}.pid")
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "  ${GREEN}●${NC} ${display_name}: localhost:${port} (PID: ${pid})"
            else
                echo -e "  ${RED}●${NC} ${display_name}: Not running (stale PID file)"
            fi
        else
            echo -e "  ${RED}●${NC} ${display_name}: Not running"
        fi
    done
    
    echo ""
    print_info "Service URLs:"
    echo "  PostgreSQL:     localhost:5432"
    echo "  Keycloak:       http://localhost:8080/auth"
    echo "  MinIO API:      http://localhost:9000"
    echo "  MinIO Console:  http://localhost:9001"
}

# Function to show logs
show_logs() {
    local service_name="$1"
    
    if [ -z "$service_name" ]; then
        print_error "Please specify a service: postgres, keycloak, minio-api, or minio-console"
        exit 1
    fi
    
    if [ ! -f "${PID_DIR}/${service_name}.log" ]; then
        print_error "No log file found for ${service_name}"
        exit 1
    fi
    
    print_info "Showing logs for ${service_name}:"
    tail -f "${PID_DIR}/${service_name}.log"
}

# Function to cleanup on exit
cleanup() {
    print_info "Cleaning up stale PID files..."
    
    if [ -d "${PID_DIR}" ]; then
        for pid_file in "${PID_DIR}"/*.pid; do
            if [ -f "$pid_file" ]; then
                pid=$(cat "$pid_file")
                if ! ps -p "$pid" > /dev/null 2>&1; then
                    rm -f "$pid_file"
                fi
            fi
        done
    fi
}

# Function to check if ports are available
check_ports() {
    print_info "Checking if required ports are available..."
    
    local ports=("5432:PostgreSQL" "8080:Keycloak" "9000:MinIO API" "9001:MinIO Console")
    local all_available=true
    
    for port_info in "${ports[@]}"; do
        IFS=':' read -r port name <<< "$port_info"
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            print_warning "Port $port ($name) is already in use"
            all_available=false
        fi
    done
    
    if [ "$all_available" = true ]; then
        print_success "All required ports are available"
    else
        print_error "Some ports are already in use. Stop the conflicting services first."
        echo ""
        echo "To find what's using a port:"
        echo "  lsof -i :PORT"
        exit 1
    fi
}

# Main script
main() {
    local command="${1:-start}"
    
    # Always check kubectl and cluster
    check_kubectl
    check_cluster
    
    case "$command" in
        start)
            check_ports
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            restart_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        cleanup)
            cleanup
            ;;
        help)
            echo "OSPO Events Manager - Port Forward Management"
            echo ""
            echo "Usage: $0 {start|stop|restart|status|logs|cleanup|help}"
            echo ""
            echo "Commands:"
            echo "  start           - Start all port-forwards"
            echo "  stop            - Stop all port-forwards"
            echo "  restart         - Restart all port-forwards"
            echo "  status          - Show port-forward status"
            echo "  logs <service>  - Show logs for a port-forward"
            echo "  cleanup         - Remove stale PID files"
            echo "  help            - Show this help message"
            echo ""
            echo "Services:"
            echo "  postgres        - PostgreSQL database"
            echo "  keycloak        - Keycloak authentication"
            echo "  minio-api       - MinIO API"
            echo "  minio-console   - MinIO Console"
            echo ""
            echo "Examples:"
            echo "  $0 start                    # Start all port-forwards"
            echo "  $0 status                   # Check status"
            echo "  $0 logs postgres            # View PostgreSQL port-forward logs"
            echo "  $0 stop                     # Stop all port-forwards"
            ;;
        *)
            print_error "Unknown command: $command"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"


