#!/bin/bash

# OpenShift Update Script for OSPO Events Manager
# This script updates an existing deployment with new code, configuration, or both

set -e

# Configuration
PROJECT_NAME="prod-rh-events-org"
RELEASE_NAME="ospo-events"
CHART_PATH="ospo-app-chart"
DEFAULT_VALUES_FILE="values-openshift.yaml"
NAMESPACE="prod-rh-events-org"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Parse command line arguments
UPDATE_TYPE=""
VALUES_FILE=""
SKIP_BUILD=false
ROLLBACK_VERSION=""
FORCE_UPDATE=false

usage() {
    echo -e "${BLUE}OSPO Events Manager - OpenShift Update Script${NC}"
    echo "=============================================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE           Update type: app, config, both (default: both)"
    echo "  -f, --values FILE         Values file to use (default: values-openshift.yaml)"
    echo "  -s, --skip-build          Skip application image build"
    echo "  -r, --rollback VERSION    Rollback to specific revision"
    echo "  --force                   Force update even if no changes detected"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Update everything (app + config)"
    echo "  $0 -t app                            # Update only application code"
    echo "  $0 -t config -f values-secure.yaml  # Update only configuration"
    echo "  $0 -s                                # Update config without rebuilding image"
    echo "  $0 -r 3                              # Rollback to revision 3"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            UPDATE_TYPE="$2"
            shift 2
            ;;
        -f|--values)
            VALUES_FILE="$2"
            shift 2
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        --force)
            FORCE_UPDATE=true
            shift
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

# Set defaults
if [ -z "$UPDATE_TYPE" ]; then
    UPDATE_TYPE="both"
fi

if [ -z "$VALUES_FILE" ]; then
    VALUES_FILE="$DEFAULT_VALUES_FILE"
fi

echo -e "${BLUE}🔄 OSPO Events Manager - OpenShift Update${NC}"
echo "=========================================="
echo "Project: $PROJECT_NAME"
echo "Release: $RELEASE_NAME"
echo "Update Type: $UPDATE_TYPE"
echo "Values File: $VALUES_FILE"
echo "Skip Build: $SKIP_BUILD"
if [ -n "$ROLLBACK_VERSION" ]; then
    echo "Rollback to: Revision $ROLLBACK_VERSION"
fi
echo ""

# Check if we're logged into OpenShift
if ! oc whoami &>/dev/null; then
    echo -e "${RED}❌ Error: Not logged into OpenShift. Please run 'oc login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenShift login verified${NC}"

# Check if the project exists
if ! oc project $PROJECT_NAME &>/dev/null; then
    echo -e "${RED}❌ Error: Project '$PROJECT_NAME' does not exist or is not accessible.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project '$PROJECT_NAME' exists and is accessible${NC}"

# Switch to the correct project
oc project $PROJECT_NAME

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ Error: Helm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Helm is installed${NC}"

# Check if release exists
if ! helm list -n $NAMESPACE | grep -q $RELEASE_NAME; then
    echo -e "${RED}❌ Error: Release '$RELEASE_NAME' not found. Please deploy first using deploy-openshift.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Release '$RELEASE_NAME' found${NC}"

# Check if values file exists
if [ ! -f "$CHART_PATH/$VALUES_FILE" ]; then
    echo -e "${RED}❌ Error: Values file '$CHART_PATH/$VALUES_FILE' not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Values file found${NC}"

# Handle rollback
if [ -n "$ROLLBACK_VERSION" ]; then
    echo -e "${YELLOW}🔙 Rolling back to revision $ROLLBACK_VERSION...${NC}"

    # Show available revisions
    echo -e "${BLUE}📋 Available revisions:${NC}"
    helm history $RELEASE_NAME -n $NAMESPACE
    echo ""

    echo "Are you sure you want to rollback to revision $ROLLBACK_VERSION? (y/N)"
    read -r confirm_rollback

    if [[ $confirm_rollback =~ ^[Yy]$ ]]; then
        helm rollback $RELEASE_NAME $ROLLBACK_VERSION -n $NAMESPACE --wait --timeout=10m

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Rollback successful!${NC}"

            # Show status
            echo -e "${YELLOW}📊 Deployment status after rollback:${NC}"
            oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME
            exit 0
        else
            echo -e "${RED}❌ Rollback failed!${NC}"
            exit 1
        fi
    else
        echo -e "${BLUE}ℹ️  Rollback cancelled${NC}"
        exit 0
    fi
fi

# Get current release info
echo -e "${YELLOW}📋 Current release information:${NC}"
CURRENT_REVISION=$(helm list -n $NAMESPACE | grep $RELEASE_NAME | awk '{print $3}')
echo "Current Revision: $CURRENT_REVISION"
echo "Chart Version: $(helm list -n $NAMESPACE | grep $RELEASE_NAME | awk '{print $9}')"
echo ""

# Check for git changes if updating application
if [[ "$UPDATE_TYPE" == "app" || "$UPDATE_TYPE" == "both" ]] && [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}🔍 Checking for application changes...${NC}"

    if git status --porcelain | grep -E '\.(ts|tsx|js|jsx|css|html|json)$' > /dev/null; then
        echo -e "${YELLOW}📝 Uncommitted changes detected in source files${NC}"
        HAS_CHANGES=true
    elif [ -n "$(git log --oneline -1)" ]; then
        echo -e "${BLUE}📝 Repository has commits - checking if rebuild needed${NC}"
        HAS_CHANGES=true
    else
        echo -e "${GREEN}✅ No source changes detected${NC}"
        HAS_CHANGES=false
    fi

    if [ "$HAS_CHANGES" = false ] && [ "$FORCE_UPDATE" = false ]; then
        echo "No application changes detected. Skip image rebuild? (Y/n)"
        read -r skip_build_confirm
        if [[ ! $skip_build_confirm =~ ^[Nn]$ ]]; then
            SKIP_BUILD=true
        fi
    fi
fi

# Build new application image if needed
if [[ "$UPDATE_TYPE" == "app" || "$UPDATE_TYPE" == "both" ]] && [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}🔨 Building updated application image...${NC}"

    # Check if build config exists
    if ! oc get bc/ospo-events-app &>/dev/null; then
        echo -e "${YELLOW}⚠️  Build config not found. Creating new one...${NC}"
        oc new-build --name=ospo-events-app --strategy=docker --binary=true
    fi

    # Start the build
    echo "Starting build from source..."
    oc start-build ospo-events-app --from-dir=../../ --follow

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image build completed successfully${NC}"

        # Get the new image digest for verification
        NEW_IMAGE_DIGEST=$(oc get istag ospo-events-app:latest -o jsonpath='{.image.metadata.name}')
        echo "New image digest: ${NEW_IMAGE_DIGEST:0:12}..."
    else
        echo -e "${RED}❌ Image build failed!${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}ℹ️  Skipping image build${NC}"
fi

# Check for configuration changes
if [[ "$UPDATE_TYPE" == "config" || "$UPDATE_TYPE" == "both" ]]; then
    echo -e "${YELLOW}🔍 Checking for configuration changes...${NC}"

    # Get current values
    helm get values $RELEASE_NAME -n $NAMESPACE > /tmp/current-values.yaml

    # Compare with new values (simplified check)
    if ! diff -q "$CHART_PATH/$VALUES_FILE" /tmp/current-values.yaml > /dev/null 2>&1; then
        echo -e "${YELLOW}📝 Configuration changes detected${NC}"
        CONFIG_CHANGED=true
    else
        echo -e "${GREEN}✅ No configuration changes detected${NC}"
        CONFIG_CHANGED=false
    fi

    # Clean up temp file
    rm -f /tmp/current-values.yaml
fi

# Validate the Helm chart before update
echo -e "${YELLOW}🔍 Validating Helm chart...${NC}"
if ! helm lint "$CHART_PATH" -f "$CHART_PATH/$VALUES_FILE"; then
    echo -e "${RED}❌ Error: Helm chart validation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Helm chart validation passed${NC}"

# Perform the update
if [[ "$UPDATE_TYPE" == "both" ]] || [[ "$UPDATE_TYPE" == "app" && "$SKIP_BUILD" = false ]] || [[ "$UPDATE_TYPE" == "config" && "$CONFIG_CHANGED" = true ]] || [ "$FORCE_UPDATE" = true ]; then

    echo -e "${YELLOW}🚀 Updating OSPO Events Manager deployment...${NC}"

    # Show what will be updated
    echo -e "${BLUE}📋 Update summary:${NC}"
    if [[ "$UPDATE_TYPE" == "app" || "$UPDATE_TYPE" == "both" ]] && [ "$SKIP_BUILD" = false ]; then
        echo "  ✓ Application image will be updated"
    fi
    if [[ "$UPDATE_TYPE" == "config" || "$UPDATE_TYPE" == "both" ]]; then
        echo "  ✓ Configuration will be updated"
    fi
    echo ""

    # Confirm update
    if [ "$FORCE_UPDATE" = false ]; then
        echo "Proceed with update? (y/N)"
        read -r confirm_update

        if [[ ! $confirm_update =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}ℹ️  Update cancelled by user${NC}"
            exit 0
        fi
    fi

    # Record pre-update state
    echo -e "${YELLOW}📸 Recording pre-update state...${NC}"
    oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME > /tmp/pre-update-pods.txt

    # Perform Helm upgrade
    helm upgrade $RELEASE_NAME "$CHART_PATH" \
        --namespace $NAMESPACE \
        --values "$CHART_PATH/$VALUES_FILE" \
        --wait \
        --timeout=15m \
        --atomic

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Update completed successfully!${NC}"

        # Show updated revision
        NEW_REVISION=$(helm list -n $NAMESPACE | grep $RELEASE_NAME | awk '{print $3}')
        echo -e "${BLUE}📋 Updated to revision: $NEW_REVISION${NC}"

        # Wait for rollout to complete
        echo -e "${YELLOW}⏳ Waiting for rollout to complete...${NC}"
        oc rollout status deployment/$(helm get values $RELEASE_NAME -n $NAMESPACE | grep -A 5 "app:" | grep "repository:" | awk -F'/' '{print $NF}' | sed 's/:.*//') --timeout=300s || true

        # Show deployment status
        echo -e "${YELLOW}📊 Post-update deployment status:${NC}"
        oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME
        echo ""

        # Show routes
        echo -e "${YELLOW}🌐 Application routes:${NC}"
        oc get routes -l app.kubernetes.io/instance=$RELEASE_NAME
        echo ""

        # Health check
        echo -e "${YELLOW}🏥 Performing health check...${NC}"
        sleep 30  # Wait for pods to be ready

        APP_POD=$(oc get pods -l app.kubernetes.io/component=application -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        if [ -n "$APP_POD" ]; then
            if oc exec $APP_POD -- curl -s http://localhost:4576/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Health check passed${NC}"
            else
                echo -e "${YELLOW}⚠️  Health check failed - application may still be starting${NC}"
            fi
        fi

        # Show revision history
        echo -e "${YELLOW}📚 Recent revision history:${NC}"
        helm history $RELEASE_NAME -n $NAMESPACE | tail -5

        echo ""
        echo -e "${GREEN}🎉 OSPO Events Manager update completed successfully!${NC}"
        echo -e "${BLUE}📝 To rollback if needed: $0 -r $CURRENT_REVISION${NC}"

    else
        echo -e "${RED}❌ Update failed!${NC}"
        echo ""
        echo -e "${YELLOW}🔍 Troubleshooting information:${NC}"
        echo "Previous revision: $CURRENT_REVISION"
        echo ""
        echo "Rollback command:"
        echo "  $0 -r $CURRENT_REVISION"
        echo ""
        echo "Debug commands:"
        echo "  oc get events --sort-by=.metadata.creationTimestamp"
        echo "  oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME"
        echo "  oc logs -l app.kubernetes.io/instance=$RELEASE_NAME --previous"
        echo "  helm status $RELEASE_NAME -n $NAMESPACE"

        exit 1
    fi

else
    echo -e "${BLUE}ℹ️  No updates needed${NC}"
    if [ "$FORCE_UPDATE" = false ]; then
        echo "Use --force to update anyway"
    fi

    # Still show current status
    echo -e "${YELLOW}📊 Current deployment status:${NC}"
    oc get pods -l app.kubernetes.io/instance=$RELEASE_NAME
fi

# Cleanup
rm -f /tmp/pre-update-pods.txt