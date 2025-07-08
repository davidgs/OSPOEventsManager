#!/bin/bash

# Helm Chart Validation Script for OSPO Events Manager
# This script validates the Helm chart before deployment

set -e

# Configuration
CHART_PATH="ospo-app-chart"
VALUES_FILE="values-openshift.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 OSPO Events Manager - Helm Chart Validation${NC}"
echo "=================================================="
echo "Chart: $CHART_PATH"
echo "Values: $VALUES_FILE"
echo ""

# Check if chart directory exists
if [ ! -d "$CHART_PATH" ]; then
    echo -e "${RED}❌ Error: Chart directory '$CHART_PATH' not found.${NC}"
    echo "Please run this script from the k8s directory."
    exit 1
fi

echo -e "${GREEN}✅ Chart directory found${NC}"

# Check if values file exists
if [ ! -f "$CHART_PATH/$VALUES_FILE" ]; then
    echo -e "${RED}❌ Error: Values file '$CHART_PATH/$VALUES_FILE' not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Values file found${NC}"

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ Error: Helm is not installed.${NC}"
    echo "Please install Helm 3.x first."
    exit 1
fi

echo -e "${GREEN}✅ Helm is installed${NC}"

# Check Helm version
HELM_VERSION=$(helm version --short)
echo -e "${BLUE}📋 Helm version: $HELM_VERSION${NC}"

# Validate chart syntax
echo -e "${YELLOW}🔍 Validating chart syntax...${NC}"
if helm lint "$CHART_PATH"; then
    echo -e "${GREEN}✅ Chart syntax validation passed${NC}"
else
    echo -e "${RED}❌ Chart syntax validation failed${NC}"
    exit 1
fi

# Validate chart with values file
echo -e "${YELLOW}🔍 Validating chart with values file...${NC}"
if helm lint "$CHART_PATH" -f "$CHART_PATH/$VALUES_FILE"; then
    echo -e "${GREEN}✅ Chart validation with values file passed${NC}"
else
    echo -e "${RED}❌ Chart validation with values file failed${NC}"
    exit 1
fi

# Template the chart (dry run)
echo -e "${YELLOW}🔍 Testing chart templating...${NC}"
if helm template ospo-events-test "$CHART_PATH" -f "$CHART_PATH/$VALUES_FILE" > /tmp/ospo-chart-output.yaml; then
    echo -e "${GREEN}✅ Chart templating successful${NC}"
    echo -e "${BLUE}📋 Generated $(wc -l < /tmp/ospo-chart-output.yaml) lines of Kubernetes manifests${NC}"
else
    echo -e "${RED}❌ Chart templating failed${NC}"
    exit 1
fi

# Check for required templates
echo -e "${YELLOW}🔍 Checking for required templates...${NC}"
REQUIRED_TEMPLATES=(
    "Deployment"
    "Service"
    "Route"
    "ConfigMap"
    "ServiceAccount"
    "PersistentVolumeClaim"
)

for template in "${REQUIRED_TEMPLATES[@]}"; do
    if grep -q "kind: $template" /tmp/ospo-chart-output.yaml; then
        echo -e "${GREEN}✅ $template found${NC}"
    else
        echo -e "${YELLOW}⚠️  $template not found (may be conditional)${NC}"
    fi
done

# Check for OpenShift-specific resources
echo -e "${YELLOW}🔍 Checking OpenShift-specific resources...${NC}"
if grep -q "route.openshift.io" /tmp/ospo-chart-output.yaml; then
    echo -e "${GREEN}✅ OpenShift Routes found${NC}"
else
    echo -e "${RED}❌ OpenShift Routes not found${NC}"
fi

# Check for security contexts
echo -e "${YELLOW}🔍 Checking security contexts...${NC}"
if grep -q "securityContext:" /tmp/ospo-chart-output.yaml; then
    echo -e "${GREEN}✅ Security contexts found${NC}"
else
    echo -e "${RED}❌ Security contexts not found${NC}"
fi

# Check for resource limits
echo -e "${YELLOW}🔍 Checking resource limits...${NC}"
if grep -q "resources:" /tmp/ospo-chart-output.yaml; then
    echo -e "${GREEN}✅ Resource limits found${NC}"
else
    echo -e "${YELLOW}⚠️  Resource limits not found${NC}"
fi

# Check for health checks
echo -e "${YELLOW}🔍 Checking health checks...${NC}"
if grep -q "livenessProbe:" /tmp/ospo-chart-output.yaml; then
    echo -e "${GREEN}✅ Liveness probes found${NC}"
else
    echo -e "${YELLOW}⚠️  Liveness probes not found${NC}"
fi

if grep -q "readinessProbe:" /tmp/ospo-chart-output.yaml; then
    echo -e "${GREEN}✅ Readiness probes found${NC}"
else
    echo -e "${YELLOW}⚠️  Readiness probes not found${NC}"
fi

# Show summary
echo ""
echo -e "${BLUE}📋 Validation Summary${NC}"
echo "===================="
echo "Chart: $CHART_PATH"
echo "Values: $VALUES_FILE"
echo "Output: /tmp/ospo-chart-output.yaml"
echo ""

# Show component count
echo -e "${BLUE}📊 Component Analysis${NC}"
echo "Deployments: $(grep -c "kind: Deployment" /tmp/ospo-chart-output.yaml || echo "0")"
echo "Services: $(grep -c "kind: Service" /tmp/ospo-chart-output.yaml || echo "0")"
echo "Routes: $(grep -c "kind: Route" /tmp/ospo-chart-output.yaml || echo "0")"
echo "ConfigMaps: $(grep -c "kind: ConfigMap" /tmp/ospo-chart-output.yaml || echo "0")"
echo "PVCs: $(grep -c "kind: PersistentVolumeClaim" /tmp/ospo-chart-output.yaml || echo "0")"
echo "ServiceAccounts: $(grep -c "kind: ServiceAccount" /tmp/ospo-chart-output.yaml || echo "0")"
echo ""

# Check values file security
echo -e "${YELLOW}🔐 Security Check${NC}"
if grep -q "change-me\|password123\|admin" "$CHART_PATH/$VALUES_FILE"; then
    echo -e "${RED}⚠️  WARNING: Default passwords found in values file!${NC}"
    echo -e "${YELLOW}Please update the following before production deployment:${NC}"
    grep -n "change-me\|password123\|admin" "$CHART_PATH/$VALUES_FILE" | head -5
    echo ""
else
    echo -e "${GREEN}✅ No default passwords found${NC}"
fi

echo -e "${GREEN}🎉 Chart validation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Review the generated manifests in /tmp/ospo-chart-output.yaml"
echo "2. Update any default passwords in $CHART_PATH/$VALUES_FILE"
echo "3. Run the deployment script: ./deploy-openshift.sh"
echo "4. Monitor the deployment progress"
echo ""

# Cleanup
rm -f /tmp/ospo-chart-output.yaml

echo -e "${GREEN}✅ Ready for deployment!${NC}"