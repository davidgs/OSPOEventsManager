#!/bin/bash
# A simple script to update only the appServer.image section in the Helm values.yaml file

# Check for required arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <image-repository> <image-tag>"
  exit 1
fi

# Get arguments
IMAGE_REPO="$1"
IMAGE_TAG="$2"
VALUES_FILE="k8s/charts/ospo-app/values.yaml"

# Check if values.yaml exists
if [ ! -f "$VALUES_FILE" ]; then
  echo "Error: Values file not found at $VALUES_FILE"
  exit 1
fi

# Create a temporary file
TMP_FILE=$(mktemp)

# Process the file line by line
cat "$VALUES_FILE" | awk -v repo="$IMAGE_REPO" -v tag="$IMAGE_TAG" '
  # Set initial state
  BEGIN { in_appserver = 0; in_image = 0; }
  
  # Detect when we enter/exit the appServer section
  /^appServer:/ { in_appserver = 1; print; next; }
  /^[a-zA-Z]/ && in_appserver == 1 { in_appserver = 0; in_image = 0; }
  
  # Detect when we enter/exit the image section
  /^[[:space:]]+image:/ && in_appserver == 1 { in_image = 1; print; next; }
  /^[[:space:]]+[a-zA-Z]/ && in_image == 1 && !/^[[:space:]]+(repository|tag):/ { in_image = 0; }
  
  # Replace repository and tag lines in appServer.image section
  /^[[:space:]]+repository:/ && in_appserver == 1 && in_image == 1 { 
    print "    repository: " repo; 
    next; 
  }
  /^[[:space:]]+tag:/ && in_appserver == 1 && in_image == 1 { 
    print "    tag: " tag; 
    next; 
  }
  
  # Print all other lines unchanged
  { print; }
' > "$TMP_FILE"

# Replace the original file with our modified version
mv "$TMP_FILE" "$VALUES_FILE"

echo "Updated values.yaml with image repository: $IMAGE_REPO, tag: $IMAGE_TAG"

# Simple check for basic YAML format
if grep -q "appServer:" "$VALUES_FILE" && grep -q "repository: $IMAGE_REPO" "$VALUES_FILE"; then
  echo "Values file updated successfully"
else
  echo "WARNING: Values file update may not be complete"
fi