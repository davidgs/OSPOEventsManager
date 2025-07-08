#!/bin/bash

# OpenShift Monitoring Script for OSPO Events Manager
# This script provides real-time monitoring and status information

set -e

# Configuration
PROJECT_NAME="prod-rh-events-org"
RELEASE_NAME="ospo-events"
NAMESPACE="prod-rh-events-org"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Parse command line arguments
WATCH_MODE=false
SHOW_LOGS=false
COMPONENT=""
TAIL_LINES=100

usage() {
    echo -e "${BLUE}OSPO Events Manager - OpenShift Monitoring Script${NC}"
    echo "=================================================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -w, --watch               Watch mode - continuous monitoring"
    echo "  -l, --logs                Show recent logs"
    echo "  -c, --component COMP      Focus on specific component (app, keycloak, postgres, minio)"
    echo "  -n, --lines N             Number of log lines to show (default: 100)"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                        # Show current status"
    echo "  $0 -w                     # Continuous monitoring"
    echo "  $0 -l                     # Show recent logs from all components"
    echo "  $0 -c app -l              # Show logs from application only"
    echo "  $0 -c postgres -w         # Watch postgres component"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -c|--component)
            COMPONENT="$2"
            shift 2
            ;;
        -n|--lines)
            TAIL_LINES="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Check if we're logged into OpenShift
if ! oc whoami &>/dev/null; then
    echo -e "${RED}❌ Error: Not logged into OpenShift. Please run 'oc login' first.${NC}"
    exit 1
fi

# Check if the project exists
if ! oc project $PROJECT_NAME &>/dev/null; then
    echo -e "${RED}❌ Error: Project '$PROJECT_NAME' does not exist or is not accessible.${NC}"
    exit 1
fi

# Switch to the correct project
oc project $PROJECT_NAME > /dev/null

show_status() {
    echo -e "${BLUE}📊 OSPO Events Manager - OpenShift Status${NC}"
    echo "=========================================="
    echo "Project: $PROJECT_NAME"
    echo "Release: $RELEASE_NAME"
    echo "Time: $(date)"
    echo ""

    # Helm release status
    echo -e "${YELLOW}🚢 Helm Release Status:${NC}"
    if helm list -n $NAMESPACE | grep -q $RELEASE_NAME; then
        helm status $RELEASE_NAME -n $NAMESPACE | grep -E "(NAMESPACE|DEPLOYED|STATUS|REVISION)"
        echo ""

        # Show recent revision history
        echo -e "${YELLOW}📚 Recent Revisions:${NC}"
        helm history $RELEASE_NAME -n $NAMESPACE | tail -3
        echo ""
    else
        echo -e "${RED}❌ Release '$RELEASE_NAME' not found${NC}"
        echo ""
    fi

    # Pod status
    echo -e "${YELLOW}🏗️  Pod Status:${NC}"
    if [ -n "$COMPONENT" ]; then
        case $COMPONENT in
            app)
                oc get pods -l app.kubernetes.io/component=application -o wide
                ;;
            keycloak)
                oc get pods -l app.kubernetes.io/component=keycloak -o wide
                ;;
            postgres)
                oc get pods -l app.kubernetes.io/component=postgresql -o wide
                ;;
            minio)
                oc get pods -l app.kubernetes.io/component=minio -o wide
                ;;
            *)
                echo -e "${RED}❌ Unknown component: $COMPONENT${NC}"
                oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME -o wide
                ;;
        esac
    else
        oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME -o wide
    fi
    echo ""

    # Service status
    echo -e "${YELLOW}🔗 Service Status:${NC}"
    oc get services -l app.kubernetes.io/instance=$RELEASE_NAME
    echo ""

    # Route status
    echo -e "${YELLOW}🌐 Route Status:${NC}"
    if oc get routes -l app.kubernetes.io/instance=$RELEASE_NAME 2>/dev/null | grep -q "NAME"; then
        oc get routes -l app.kubernetes.io/instance=$RELEASE_NAME
        echo ""

        # Test route connectivity
        echo -e "${YELLOW}🔍 Route Connectivity:${NC}"
        ROUTE_URL=$(oc get routes -l app.kubernetes.io/instance=$RELEASE_NAME -o jsonpath='{.items[0].spec.host}' 2>/dev/null || echo "")
        if [ -n "$ROUTE_URL" ]; then
            echo "Testing: https://$ROUTE_URL"
            if curl -k -s --connect-timeout 5 "https://$ROUTE_URL" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Route is accessible${NC}"
            else
                echo -e "${RED}❌ Route is not accessible${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  No routes found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No routes found${NC}"
    fi
    echo ""

    # Storage status
    echo -e "${YELLOW}💾 Storage Status:${NC}"
    oc get pvc -l app.kubernetes.io/instance=$RELEASE_NAME
    echo ""

    # Resource usage
    echo -e "${YELLOW}📈 Resource Usage:${NC}"
    if oc top pods -l app.kubernetes.io/instance=$RELEASE_NAME 2>/dev/null | grep -q "CPU"; then
        oc top pods -l app.kubernetes.io/instance=$RELEASE_NAME
    else
        echo -e "${YELLOW}⚠️  Metrics not available (metrics server may not be installed)${NC}"
    fi
    echo ""

    # Recent events
    echo -e "${YELLOW}📋 Recent Events:${NC}"
    oc get events --sort-by=.metadata.creationTimestamp | tail -10
    echo ""

    # Health check
    echo -e "${YELLOW}🏥 Health Check:${NC}"
    APP_POD=$(oc get pods -l app.kubernetes.io/component=application -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$APP_POD" ]; then
        if oc get pod $APP_POD -o jsonpath='{.status.phase}' | grep -q "Running"; then
            echo "Application pod: $APP_POD - Running"
            if oc exec $APP_POD -- curl -s http://localhost:4576/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Health endpoint accessible${NC}"
            else
                echo -e "${YELLOW}⚠️  Health endpoint not accessible${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Application pod not running${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No application pods found${NC}"
    fi
    echo ""
}

show_logs() {
    echo -e "${BLUE}📜 Recent Logs${NC}"
    echo "=============="
    echo ""

    if [ -n "$COMPONENT" ]; then
        case $COMPONENT in
            app)
                echo -e "${YELLOW}📱 Application Logs:${NC}"
                oc logs -l app.kubernetes.io/component=application --tail=$TAIL_LINES --timestamps
                ;;
            keycloak)
                echo -e "${YELLOW}🔐 Keycloak Logs:${NC}"
                oc logs -l app.kubernetes.io/component=keycloak --tail=$TAIL_LINES --timestamps
                ;;
            postgres)
                echo -e "${YELLOW}🐘 PostgreSQL Logs:${NC}"
                oc logs -l app.kubernetes.io/component=postgresql --tail=$TAIL_LINES --timestamps
                ;;
            minio)
                echo -e "${YELLOW}🪣 MinIO Logs:${NC}"
                oc logs -l app.kubernetes.io/component=minio --tail=$TAIL_LINES --timestamps
                ;;
            *)
                echo -e "${RED}❌ Unknown component: $COMPONENT${NC}"
                echo -e "${YELLOW}📱 All Application Logs:${NC}"
                oc logs -l app.kubernetes.io/instance=$RELEASE_NAME --tail=$TAIL_LINES --timestamps
                ;;
        esac
    else
        echo -e "${YELLOW}📱 Application Logs:${NC}"
        oc logs -l app.kubernetes.io/component=application --tail=$TAIL_LINES --timestamps
        echo ""

        echo -e "${YELLOW}🔐 Keycloak Logs (last 20 lines):${NC}"
        oc logs -l app.kubernetes.io/component=keycloak --tail=20 --timestamps
        echo ""

        echo -e "${YELLOW}🐘 PostgreSQL Logs (last 20 lines):${NC}"
        oc logs -l app.kubernetes.io/component=postgresql --tail=20 --timestamps
        echo ""

        echo -e "${YELLOW}🪣 MinIO Logs (last 20 lines):${NC}"
        oc logs -l app.kubernetes.io/component=minio --tail=20 --timestamps
        echo ""
    fi
}

# Main logic
if [ "$WATCH_MODE" = true ]; then
    echo -e "${BLUE}👁️  Starting watch mode (press Ctrl+C to stop)...${NC}"
    echo ""

    while true; do
        clear
        show_status

        if [ "$SHOW_LOGS" = true ]; then
            echo -e "${YELLOW}📜 Recent Logs (last 10 lines):${NC}"
            if [ -n "$COMPONENT" ]; then
                case $COMPONENT in
                    app)
                        oc logs -l app.kubernetes.io/component=application --tail=10 --timestamps
                        ;;
                    keycloak)
                        oc logs -l app.kubernetes.io/component=keycloak --tail=10 --timestamps
                        ;;
                    postgres)
                        oc logs -l app.kubernetes.io/component=postgresql --tail=10 --timestamps
                        ;;
                    minio)
                        oc logs -l app.kubernetes.io/component=minio --tail=10 --timestamps
                        ;;
                esac
            else
                oc logs -l app.kubernetes.io/component=application --tail=10 --timestamps
            fi
            echo ""
        fi

        echo -e "${BLUE}🔄 Refreshing in 30 seconds... (Ctrl+C to stop)${NC}"
        sleep 30
    done
else
    show_status

    if [ "$SHOW_LOGS" = true ]; then
        show_logs
    fi
fi