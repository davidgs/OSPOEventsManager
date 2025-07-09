#!/bin/bash

# Cleanup Script for OSPO Events Manager
# This script removes existing resources that conflict with Helm deployment

set -e

# Configuration
PROJECT_NAME="prod-rh-events-org"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 OSPO Events Manager - Cleanup Existing Resources${NC}"
echo "======================================================="
echo "Project: $PROJECT_NAME"
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

echo -e "${YELLOW}🔍 Checking for existing resources...${NC}"

# List existing resources that might conflict
echo "Current resources in project:"
oc get all --no-headers 2>/dev/null | grep -E "(postgres|keycloak|ospo|minio)" || echo "No matching resources found"

echo ""
echo -e "${YELLOW}⚠️  This will delete existing OSPO-related resources to prepare for Helm deployment.${NC}"
echo -e "${YELLOW}⚠️  Make sure you have backups of any important data!${NC}"
echo ""
echo "Do you want to proceed with cleanup? (y/N)"
read -r confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}ℹ️  Cleanup cancelled by user${NC}"
    exit 0
fi

echo -e "${YELLOW}🧹 Starting cleanup...${NC}"

# Function to safely delete resources
safe_delete() {
    local resource_type=$1
    local resource_name=$2

    if oc get $resource_type $resource_name &>/dev/null; then
        echo -e "${YELLOW}🗑️  Deleting $resource_type/$resource_name...${NC}"
        oc delete $resource_type $resource_name --ignore-not-found=true
        echo -e "${GREEN}✅ Deleted $resource_type/$resource_name${NC}"
    else
        echo -e "${BLUE}ℹ️  $resource_type/$resource_name not found, skipping${NC}"
    fi
}

# Delete deployments
safe_delete deployment postgres
safe_delete deployment keycloak
safe_delete deployment minio
safe_delete deployment ospo-app
safe_delete deployment ospo-events-app

# Delete services
safe_delete service postgres
safe_delete service keycloak
safe_delete service minio
safe_delete service ospo-app
safe_delete service ospo-events-app

# Delete routes
safe_delete route postgres
safe_delete route keycloak
safe_delete route minio
safe_delete route ospo-app
safe_delete route ospo-events-app

# Delete config maps
safe_delete configmap postgres-config
safe_delete configmap keycloak-config
safe_delete configmap keycloak-client-config
safe_delete configmap keycloak-realm-config
safe_delete configmap minio-config
safe_delete configmap ospo-config

# Delete secrets
safe_delete secret postgres-secret
safe_delete secret keycloak-secret
safe_delete secret minio-secret
safe_delete secret ospo-secret

# Delete persistent volume claims (be careful with this!)
echo -e "${YELLOW}⚠️  Found PVCs (these contain data):${NC}"
oc get pvc 2>/dev/null | grep -E "(postgres|keycloak|minio|ospo)" || echo "No matching PVCs found"

echo ""
echo "Do you want to delete PVCs? This will DELETE ALL DATA! (y/N)"
read -r delete_pvcs

if [[ $delete_pvcs =~ ^[Yy]$ ]]; then
    echo -e "${RED}🗑️  Deleting PVCs - THIS WILL DELETE ALL DATA!${NC}"
    safe_delete pvc postgres-pvc
    safe_delete pvc postgres-data
    safe_delete pvc minio-pvc
    safe_delete pvc minio-data
    safe_delete pvc ospo-uploads-pvc
    safe_delete pvc uploads-pvc
else
    echo -e "${BLUE}ℹ️  Keeping PVCs (recommended for data preservation)${NC}"
fi

# Delete service accounts
safe_delete serviceaccount postgres
safe_delete serviceaccount keycloak
safe_delete serviceaccount minio
safe_delete serviceaccount ospo-app
safe_delete serviceaccount ospo-events-app

# Delete any jobs
safe_delete job postgres-init
safe_delete job keycloak-init
safe_delete job minio-init

# Delete build configs and image streams
safe_delete buildconfig ospo-events-app
safe_delete imagestream ospo-events-app

echo ""
echo -e "${YELLOW}🔍 Checking for remaining resources...${NC}"
remaining_resources=$(oc get all --no-headers 2>/dev/null | grep -E "(postgres|keycloak|ospo|minio)" | wc -l)

if [ "$remaining_resources" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some resources still exist:${NC}"
    oc get all --no-headers 2>/dev/null | grep -E "(postgres|keycloak|ospo|minio)"
    echo ""
    echo "Do you want to force delete all remaining resources? (y/N)"
    read -r force_delete

    if [[ $force_delete =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  Force deleting all remaining resources...${NC}"
        oc delete all -l app=postgres --ignore-not-found=true
        oc delete all -l app=keycloak --ignore-not-found=true
        oc delete all -l app=minio --ignore-not-found=true
        oc delete all -l app=ospo-app --ignore-not-found=true
        oc delete all -l app=ospo-events-app --ignore-not-found=true
    fi
else
    echo -e "${GREEN}✅ All conflicting resources have been cleaned up${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Run the deployment script: ./deploy-openshift.sh"
echo "2. Monitor the deployment progress"
echo "3. Check the application logs after deployment"
echo ""
echo -e "${YELLOW}⚠️  Remember to reconfigure your application after deployment if you deleted PVCs${NC}"