#!/bin/bash

# OpenShift Deployment Script for OSPO Events Manager - v2.0
# This script provides a streamlined deployment using the new repeatable process

set -e

# Configuration
PROJECT_NAME="prod-rh-events-org"
RELEASE_NAME="ospo-events"
CHART_PATH="ospo-app-chart"
VALUES_FILE="values-openshift.yaml"
NAMESPACE="prod-rh-events-org"
TIMEOUT="15m"

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
    elif [ "$1" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    else
        echo -e "${BLUE}ℹ️  $2${NC}"
    fi
}

echo -e "${BLUE}🚀 OSPO Events Manager - Repeatable OpenShift Deployment v2.0${NC}"
echo "================================================================="
echo "Project: $PROJECT_NAME"
echo "Release: $RELEASE_NAME"
echo "Chart: $CHART_PATH"
echo "Values: $VALUES_FILE"
echo "Timeout: $TIMEOUT"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check if we're logged into OpenShift
if ! oc whoami &>/dev/null; then
    print_status "FAIL" "Not logged into OpenShift. Please run 'oc login' first."
    exit 1
fi
print_status "SUCCESS" "OpenShift login verified (user: $(oc whoami))"

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    print_status "FAIL" "Helm is not installed. Please install Helm first."
    echo "Visit: https://helm.sh/docs/intro/install/"
    exit 1
fi
print_status "SUCCESS" "Helm is installed (version: $(helm version --short))"

# Check if chart directory exists
if [ ! -d "$CHART_PATH" ]; then
    print_status "FAIL" "Chart directory '$CHART_PATH' not found."
    echo "Please run this script from the k8s directory."
    exit 1
fi
print_status "SUCCESS" "Chart directory found"

# Check if values file exists
if [ ! -f "$CHART_PATH/$VALUES_FILE" ]; then
    print_status "FAIL" "Values file '$CHART_PATH/$VALUES_FILE' not found."
    exit 1
fi
print_status "SUCCESS" "Values file found"

# Validate the Helm chart
echo -e "${YELLOW}🔍 Validating Helm chart...${NC}"
if ! helm lint "$CHART_PATH" -f "$CHART_PATH/$VALUES_FILE" --quiet; then
    print_status "FAIL" "Helm chart validation failed"
    exit 1
fi
print_status "SUCCESS" "Helm chart validation passed"

# Check if release already exists
if helm list -n $NAMESPACE | grep -q $RELEASE_NAME; then
    print_status "INFO" "Release '$RELEASE_NAME' already exists. Will upgrade..."
    HELM_COMMAND="upgrade"
else
    print_status "INFO" "Installing new release '$RELEASE_NAME'..."
    HELM_COMMAND="install"
fi

echo ""
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Check for conflicting resources
echo -e "${YELLOW}🔍 Checking for conflicting resources...${NC}"
conflicting_resources=""

# Check for conflicting ConfigMaps
if oc get configmap keycloak-client-config -n $NAMESPACE >/dev/null 2>&1; then
    if ! oc get configmap keycloak-client-config -n $NAMESPACE -o yaml | grep -q "helm.sh/managed-by"; then
        conflicting_resources="$conflicting_resources keycloak-client-config(configmap)"
    fi
fi

# Check for conflicting PVCs
if oc get pvc ospo-uploads-pvc -n $NAMESPACE >/dev/null 2>&1; then
    if ! oc get pvc ospo-uploads-pvc -n $NAMESPACE -o yaml | grep -q "helm.sh/managed-by"; then
        conflicting_resources="$conflicting_resources ospo-uploads-pvc(pvc)"
    fi
fi

if [ -n "$conflicting_resources" ]; then
    print_status "WARNING" "Found conflicting resources not managed by Helm:$conflicting_resources"
    echo ""
    echo "These resources need to be removed before Helm can manage them."
    echo "Would you like to remove them now? (y/N)"
    read -r remove_conflicts

    if [[ $remove_conflicts =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🧹 Removing conflicting resources...${NC}"

        if [[ $conflicting_resources == *"keycloak-client-config"* ]]; then
            oc delete configmap keycloak-client-config -n $NAMESPACE --ignore-not-found=true
            print_status "SUCCESS" "Removed keycloak-client-config ConfigMap"
        fi

        if [[ $conflicting_resources == *"ospo-uploads-pvc"* ]]; then
            oc delete pvc ospo-uploads-pvc -n $NAMESPACE --ignore-not-found=true
            print_status "SUCCESS" "Removed ospo-uploads-pvc PVC"
        fi

        echo ""
        print_status "SUCCESS" "Conflicting resources removed. Continuing with deployment..."
    else
        print_status "FAIL" "Cannot proceed with conflicting resources. Please remove them manually:"
        echo "  oc delete configmap keycloak-client-config -n $NAMESPACE"
        echo "  oc delete pvc ospo-uploads-pvc -n $NAMESPACE"
        exit 1
    fi
else
    print_status "SUCCESS" "No conflicting resources found"
fi

# Deploy using the new repeatable process
echo -e "${YELLOW}📦 Deploying OSPO Events Manager...${NC}"

start_time=$(date +%s)

# Single command deployment with comprehensive configuration
helm $HELM_COMMAND $RELEASE_NAME "$CHART_PATH" \
    --namespace $NAMESPACE \
    --values "$CHART_PATH/$VALUES_FILE" \
    --wait \
    --timeout=$TIMEOUT

deployment_result=$?
end_time=$(date +%s)
duration=$((end_time - start_time))

if [ $deployment_result -eq 0 ]; then
    print_status "SUCCESS" "Deployment completed successfully in ${duration}s!"

    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo "Project: $PROJECT_NAME"
    echo "Release: $RELEASE_NAME"
    echo "Namespace: $NAMESPACE"
    echo "Duration: ${duration}s"
    echo ""

    # Wait a moment for resources to be ready
    echo -e "${YELLOW}⏳ Waiting for resources to stabilize...${NC}"
    sleep 10

    # Show deployment status
    echo -e "${YELLOW}📊 Checking deployment status...${NC}"
    echo "Pods:"
    oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME --no-headers | while read line; do
        echo "  $line"
    done
    echo ""

    # Show routes
    echo -e "${YELLOW}🌐 Available routes:${NC}"
    oc get routes -l app.kubernetes.io/instance=$RELEASE_NAME --no-headers | while read line; do
        echo "  $line"
    done
    echo ""

    # Show services
    echo -e "${YELLOW}🔗 Services:${NC}"
    oc get svc -l app.kubernetes.io/instance=$RELEASE_NAME --no-headers | while read line; do
        echo "  $line"
    done
    echo ""

    # Show persistent volume claims
    echo -e "${YELLOW}💾 Storage:${NC}"
    oc get pvc -l app.kubernetes.io/instance=$RELEASE_NAME --no-headers | while read line; do
        echo "  $line"
    done
    echo ""

    # Show application URLs
    echo -e "${BLUE}🌐 Application URLs:${NC}"

    app_route=$(oc get route $RELEASE_NAME-ospo-app -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
    if [ -n "$app_route" ]; then
        echo "Main Application: https://$app_route"
    fi

    keycloak_route=$(oc get route $RELEASE_NAME-keycloak -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
    if [ -n "$keycloak_route" ]; then
        echo "Keycloak Admin: https://$keycloak_route/auth"
    fi

    minio_route=$(oc get route $RELEASE_NAME-minio -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
    if [ -n "$minio_route" ]; then
        echo "MinIO Console: https://$minio_route"
    fi

    echo ""

    # Run automated tests if available
    if [ -f "test-deployment.sh" ]; then
        echo -e "${YELLOW}🧪 Running automated deployment tests...${NC}"
        echo ""

        if ./test-deployment.sh $NAMESPACE $RELEASE_NAME; then
            print_status "SUCCESS" "All deployment tests passed!"
        else
            print_status "WARNING" "Some deployment tests failed - check output above"
        fi
        echo ""
    fi

    # Show next steps
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "1. Visit the application: https://$app_route"
    echo "2. Test login functionality"
    echo "3. Create your first event"
    echo "4. Monitor with: oc get pods -w"
    echo "5. Check logs: oc logs -l app.kubernetes.io/instance=$RELEASE_NAME -f"
    echo ""

    # Show troubleshooting info
    echo -e "${BLUE}🔧 Troubleshooting:${NC}"
    echo "• Health check: curl https://$app_route/api/health"
    echo "• Database: oc exec deployment/$RELEASE_NAME-postgres -- psql -U ospo_user -d ospo_events -c 'SELECT current_database();'"
    echo "• Keycloak: curl https://$keycloak_route/auth/realms/ospo-events"
    echo "• Events: oc get events --sort-by=.metadata.creationTimestamp"
    echo ""

    echo -e "${GREEN}🎉 OSPO Events Manager deployed successfully!${NC}"
    echo -e "${GREEN}🔒 Authentication is configured and ready to use${NC}"
    echo -e "${GREEN}💾 Database schema is automatically created${NC}"
    echo -e "${GREEN}🌐 All routes are configured with TLS${NC}"

else
    print_status "FAIL" "Deployment failed after ${duration}s!"
    echo ""
    echo -e "${YELLOW}🔍 Troubleshooting commands:${NC}"
    echo "1. Check Helm status: helm status $RELEASE_NAME -n $NAMESPACE"
    echo "2. Check events: oc get events --sort-by=.metadata.creationTimestamp"
    echo "3. Check pod status: oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME"
    echo "4. Check logs: oc logs -l app.kubernetes.io/instance=$RELEASE_NAME"
    echo "5. Describe failed pods: oc describe pods -l app.kubernetes.io/instance=$RELEASE_NAME"
    echo "6. Check job status: oc get jobs -l app.kubernetes.io/instance=$RELEASE_NAME"
    echo ""
    echo -e "${YELLOW}🔄 To retry deployment:${NC}"
    echo "helm upgrade $RELEASE_NAME $CHART_PATH --namespace $NAMESPACE --values $CHART_PATH/$VALUES_FILE"
    echo ""
    echo -e "${YELLOW}🧹 To clean up and start fresh:${NC}"
    echo "helm uninstall $RELEASE_NAME -n $NAMESPACE"
    echo "kubectl delete namespace $NAMESPACE"
    echo ""

    exit 1
fi