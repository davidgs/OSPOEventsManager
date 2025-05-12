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

# Update the Helm chart values using the dedicated script
echo "Updating Helm chart values..."
if [ -f "k8s/set-image-values.sh" ]; then
  # Use the dedicated script for safety
  ./k8s/set-image-values.sh "${REGISTRY}${IMAGE_NAME}" "${IMAGE_TAG}"
else
  echo "ERROR: Image values update script not found at k8s/set-image-values.sh"
  echo "Please ensure the script exists and is executable"
  exit 1
fi

echo "Build process completed successfully"
echo "To deploy, run: helm upgrade --install ospo-app ./k8s/charts/ospo-app"