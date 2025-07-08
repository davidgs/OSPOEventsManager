#!/bin/bash

# OpenShift Project Setup Script for OSPO Events Manager
# This script should be run by a cluster administrator to set up necessary projects

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAIN_PROJECT="prod-rh-events-org"

echo -e "${BLUE}🔧 OpenShift Project Setup for OSPO Events Manager${NC}"
echo "=================================================="
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
    oc new-project $MAIN_PROJECT --display-name="OSPO Events Manager" --description="OSPO Events Manager Application (includes Otterize security)"
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
echo "Main Application Project (includes Otterize security):"
oc get project $MAIN_PROJECT -o wide

echo ""
echo -e "${GREEN}✅ Project setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. The user ($USER_EMAIL) can now run the deployment script:"
echo "   ./deploy-openshift.sh"
echo ""
echo "2. If you need to grant access to additional users, run:"
echo "   oc adm policy add-role-to-user admin USER_EMAIL -n $MAIN_PROJECT"
echo ""
echo "3. To remove the project later (if needed):"
echo "   oc delete project $MAIN_PROJECT"
echo ""
echo -e "${YELLOW}⚠️  Note: The application and Otterize security will be installed in the same project${NC}"
echo -e "${YELLOW}⚠️  Deleting the project will remove all associated resources and data!${NC}"