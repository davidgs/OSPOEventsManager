#!/bin/bash

# OpenShift Project Setup Script for OSPO Events Manager
# This script should be run by a cluster administrator to set up necessary projects
# Usage: ./setup-projects.sh [--dev|--prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo "Usage: $0 [--dev|--prod]"
    echo ""
    echo "Options:"
    echo "  --dev          Set up development environment project"
    echo "  --prod         Set up production environment project"
    echo "  --help         Show this help message"
    echo ""
    echo "Requirements:"
    echo "  - .env file must exist in the parent directory"
    echo "  - OpenShift CLI (oc) must be installed and authenticated"
    echo "  - Must be run by a cluster administrator"
    echo ""
    echo "Example:"
    echo "  $0 --dev"
    echo "  $0 --prod"
}

# Parse command line arguments
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
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ -z "$ENVIRONMENT" ]]; then
    echo -e "${RED}❌ Environment not specified. Use --dev or --prod${NC}"
    show_usage
    exit 1
fi

# Check for .env file in parent directory
if [[ ! -f ../.env ]]; then
    echo -e "${RED}❌ .env file not found in parent directory!${NC}"
    echo "Please ensure .env file exists in the project root:"
    echo "  cp ../.env.template ../.env"
    echo "  # Edit ../.env with your configuration"
    exit 1
fi

# Load environment variables (preserve our command line ENVIRONMENT)
echo -e "${BLUE}🔧 Loading configuration from .env file...${NC}"
TEMP_ENVIRONMENT="$ENVIRONMENT"  # Save our command line argument
set -a  # automatically export all variables
source ../.env
set +a  # turn off automatic export
ENVIRONMENT="$TEMP_ENVIRONMENT"  # Restore our command line argument

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "dev" ]]; then
    MAIN_PROJECT="$DEV_NAMESPACE"
    DISPLAY_NAME="OSPO Events Manager (Development)"
    DESCRIPTION="OSPO Events Manager Development Environment"
else
    MAIN_PROJECT="$PROD_NAMESPACE"
    DISPLAY_NAME="OSPO Events Manager (Production)"
    DESCRIPTION="OSPO Events Manager Production Environment"
fi

echo -e "${BLUE}🔧 OpenShift Project Setup for OSPO Events Manager${NC}"
echo "=================================================="
echo "Environment: $ENVIRONMENT"
echo "Project: $MAIN_PROJECT"
echo ""

# Check if we're logged into OpenShift
if ! oc whoami &>/dev/null; then
    echo -e "${RED}❌ Error: Not logged into OpenShift. Please run 'oc login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenShift login verified${NC}"
echo "Logged in as: $(oc whoami)"
echo ""

# Check if user has admin privileges
if ! oc auth can-i create projects &>/dev/null; then
    echo -e "${RED}❌ Error: Current user does not have permission to create projects.${NC}"
    echo "This script must be run by a cluster administrator."
    exit 1
fi

echo -e "${GREEN}✅ User has project creation permissions${NC}"
echo ""

# Create main application project
echo -e "${YELLOW}🏗️  Creating main application project...${NC}"
if oc get project $MAIN_PROJECT &>/dev/null; then
    echo -e "${YELLOW}⚠️  Project '$MAIN_PROJECT' already exists${NC}"
else
    oc new-project $MAIN_PROJECT --display-name="$DISPLAY_NAME" --description="$DESCRIPTION"
    echo -e "${GREEN}✅ Created project '$MAIN_PROJECT'${NC}"
fi

echo ""
echo -e "${BLUE}👥 Setting up user permissions...${NC}"

# Prompt for user email to grant permissions
echo "Enter the email address of the user who will deploy the application:"
read -r USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo -e "${YELLOW}⚠️  No user email provided. Skipping user permission setup.${NC}"
else
    echo -e "${YELLOW}🔑 Granting permissions to user: $USER_EMAIL${NC}"

    # Grant admin permissions to the main project
    oc adm policy add-role-to-user admin $USER_EMAIL -n $MAIN_PROJECT

    echo -e "${GREEN}✅ Permissions granted to $USER_EMAIL${NC}"
    echo "  - Admin access to $MAIN_PROJECT"
fi

echo ""
echo -e "${BLUE}🔍 Verifying project setup...${NC}"

# Show project information
echo -e "${YELLOW}📋 Project Information:${NC}"
echo ""
echo "$ENVIRONMENT Environment Project:"
oc get project $MAIN_PROJECT -o wide

echo ""
echo -e "${GREEN}✅ Project setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. The user ($USER_EMAIL) can now run the deployment script:"
echo "   cd .. && ./deploy.sh --$ENVIRONMENT"
echo ""
echo "2. If you need to grant access to additional users, run:"
echo "   oc adm policy add-role-to-user admin USER_EMAIL -n $MAIN_PROJECT"
echo ""
echo "3. To remove the project later (if needed):"
echo "   oc delete project $MAIN_PROJECT"
echo ""
echo -e "${YELLOW}⚠️  Deleting the project will remove all associated resources and data!${NC}"