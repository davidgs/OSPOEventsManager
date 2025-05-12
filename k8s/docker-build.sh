#!/bin/bash
# Script to build and tag Docker images for OSPO Event Management App
# Usage: 
#   ./docker-build.sh                 # Build and tag as latest
#   ./docker-build.sh registry.com    # Build, tag, and push to registry
set -e  # Exit on any error

# Configuration
APP_NAME="ospo-app"
VERSION=$(date +"%Y%m%d.%H%M%S")
LATEST_TAG="$APP_NAME:latest"
VERSION_TAG="$APP_NAME:$VERSION"
REGISTRY="${1:-local}"  # Use first argument as registry, or "local" if not provided

# Display banner
echo "=================================================="
echo "     OSPO Event Manager Docker Image Builder      "
echo "=================================================="
echo "Building version: $VERSION"
echo "Registry target: $REGISTRY"
echo ""

# Function to check if Docker is installed
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    echo "Please install Docker before continuing"
    exit 1
  fi
}

# Function to build the Docker image
build_image() {
  echo "Building Docker image..."
  docker build -t $LATEST_TAG -t $VERSION_TAG .
  echo "✓ Build completed successfully!"
}

# Function to display image information
display_image_info() {
  echo ""
  echo "Image Details:"
  echo "------------------------------------------------"
  docker images $LATEST_TAG --format "Repository: {{.Repository}}\nTag: {{.Tag}}\nCreated: {{.CreatedSince}}\nSize: {{.Size}}"
  echo ""
}

# Function to push to registry
push_to_registry() {
  if [ "$REGISTRY" != "local" ]; then
    echo "Tagging image for registry: $REGISTRY"
    REGISTRY_LATEST="$REGISTRY/$LATEST_TAG"
    REGISTRY_VERSION="$REGISTRY/$VERSION_TAG"
    
    docker tag $LATEST_TAG $REGISTRY_LATEST
    docker tag $VERSION_TAG $REGISTRY_VERSION
    
    echo "Pushing images to registry..."
    docker push $REGISTRY_LATEST
    docker push $REGISTRY_VERSION
    echo "✓ Images pushed to registry!"
  else
    echo "No registry specified. Use ./docker-build.sh <registry-url> to push to a registry."
  fi
}

# Function to show how to run the image
show_run_instructions() {
  echo ""
  echo "To run this image locally:"
  echo "------------------------------------------------"
  echo "docker run -p 5000:5000 -e DATABASE_URL=your_db_url $LATEST_TAG"
  echo ""
  echo "For Kubernetes:"
  echo "------------------------------------------------"
  echo "1. Update image in values.yaml with: $VERSION_TAG"
  echo "2. Run: helm upgrade --install ospo-app ./k8s/charts/ospo-app"
  echo ""
}

# Main execution
check_docker
build_image
display_image_info
push_to_registry
show_run_instructions

echo "=================================================="
echo "                Process completed!                "
echo "=================================================="