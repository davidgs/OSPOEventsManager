#!/bin/bash
set -e

# Configuration
APP_NAME="ospo-app"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-localhost:5000}"
IMAGE_NAME="${DOCKER_REGISTRY}/${APP_NAME}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build the Docker image
echo -e "${YELLOW}Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}...${NC}"
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
echo -e "${GREEN}Docker image built successfully.${NC}"

# Push the image to the registry if it's not localhost
if [[ "$DOCKER_REGISTRY" != "localhost:5000" ]]; then
  echo -e "${YELLOW}Pushing Docker image to registry...${NC}"
  docker push "${IMAGE_NAME}:${IMAGE_TAG}"
  echo -e "${GREEN}Docker image pushed successfully.${NC}"
fi

# Update only the appServer image in values.yaml
echo -e "${YELLOW}Updating app server image in Helm chart values...${NC}"

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS version of sed
  sed -i '' "s|repository: .*|repository: ${IMAGE_NAME}|g" k8s/charts/ospo-app/values.yaml
  sed -i '' "s|tag: .*|tag: ${IMAGE_TAG}|g" k8s/charts/ospo-app/values.yaml
else
  # Linux/other versions of sed
  sed -i "s|repository: .*|repository: ${IMAGE_NAME}|g" k8s/charts/ospo-app/values.yaml
  sed -i "s|tag: .*|tag: ${IMAGE_TAG}|g" k8s/charts/ospo-app/values.yaml
fi

echo -e "${GREEN}App server image updated successfully in Helm chart values.${NC}"

# Deploy the application using Helm
echo -e "${YELLOW}Deploying application with Helm...${NC}"
helm upgrade --install ${APP_NAME} k8s/charts/ospo-app
echo -e "${GREEN}Deployment completed successfully.${NC}"

# Instructions for accessing the application
echo -e "${YELLOW}======================================================================${NC}"
echo -e "${YELLOW}The application has been deployed to your Kubernetes cluster!${NC}"
echo -e "${YELLOW}To access it, you can use one of the following methods:${NC}"
echo -e "${GREEN}1. Port forwarding:${NC}"
echo -e "   kubectl port-forward svc/${APP_NAME}-app 8080:5000"
echo -e "   Then access: http://localhost:8080"
echo -e "${GREEN}2. Using the Ingress:${NC}"
echo -e "   Add 'ospo-app.local' to your /etc/hosts file pointing to your cluster IP"
echo -e "   Then access: http://ospo-app.local"
echo -e "${YELLOW}======================================================================${NC}"