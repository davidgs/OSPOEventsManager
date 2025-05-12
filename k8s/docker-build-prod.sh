#!/bin/bash
set -e

# Script to build a production-ready Docker image for the OSPO Events App
# This script builds a proper Docker image with the full application

# Variables
IMAGE_NAME="ospo-events-app"
IMAGE_TAG=$(date +"%Y%m%d-%H%M%S") # Use timestamp as tag
REGISTRY="" # Set your registry here, e.g., "your-registry.com/"

# Check if registry is provided as an argument
if [ "$1" != "" ]; then
  REGISTRY="$1/"
  echo "Using registry: $REGISTRY"
fi

# Create a full tag with registry
FULL_TAG="${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_TAG="${REGISTRY}${IMAGE_NAME}:latest"

echo "Building Docker image: $FULL_TAG"

# Build the Docker image with proper cache optimization
docker build -t "$FULL_TAG" -f Dockerfile.prod .

# Tag as latest
docker tag "$FULL_TAG" "$LATEST_TAG"

echo "Docker image built: $FULL_TAG"
echo "Also tagged as: $LATEST_TAG"

# Push to registry if provided
if [ "$REGISTRY" != "" ]; then
  echo "Pushing to registry: $REGISTRY"
  docker push "$FULL_TAG"
  docker push "$LATEST_TAG"
  echo "Images pushed to registry"
fi

# Update the Helm chart values
echo "Updating Helm chart values..."
VALUES_FILE="k8s/charts/ospo-app/values.yaml"

# Check if values file exists
if [ -f "$VALUES_FILE" ]; then
  # Use sed to update the image repository and tag
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS version of sed
    sed -i '' "s|repository:.*|repository: ${REGISTRY}${IMAGE_NAME}|g" "$VALUES_FILE"
    sed -i '' "s|tag:.*|tag: ${IMAGE_TAG}|g" "$VALUES_FILE"
  else
    # Linux version of sed
    sed -i "s|repository:.*|repository: ${REGISTRY}${IMAGE_NAME}|g" "$VALUES_FILE"
    sed -i "s|tag:.*|tag: ${IMAGE_TAG}|g" "$VALUES_FILE"
  fi
  echo "Updated Helm chart values with new image: ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
else
  echo "WARNING: Could not find Helm values file at $VALUES_FILE"
fi

echo "Build process completed successfully"
echo "To deploy, run: helm upgrade --install ospo-app ./k8s/charts/ospo-app"