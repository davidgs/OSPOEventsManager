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

# Update the Helm chart values to use the new image
echo -e "${YELLOW}Updating Helm chart values...${NC}"
cat > k8s/charts/ospo-app/values.yaml << EOF
# Default values for ospo-app chart
replicaCount: 1

appServer:
  image:
    repository: ${IMAGE_NAME}
    tag: ${IMAGE_TAG}
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 5000
  env:
    NODE_ENV: production
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 200m
      memory: 256Mi

postgresql:
  image:
    repository: postgres
    tag: 16-alpine
    pullPolicy: IfNotPresent
  auth:
    username: ospo_user
    password: ospo_password123
    database: ospo_events
    existingSecret: null
  service:
    port: 5432
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 200m
      memory: 256Mi
  persistence:
    enabled: false

keycloak:
  service:
    port: 8080
  auth:
    adminUser: admin
    secretKeys:
      adminPasswordKey: admin-password
  persistence:
    enabled: false
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 500m
      memory: 1Gi

minio:
  service:
    port: 9000
    consolePort: 9001
  auth:
    rootUser: minio
    rootPassword: minio123
    secretKeys:
      rootPasswordKey: root-password
  defaultBuckets: uploads
  persistence:
    enabled: false
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 200m
      memory: 256Mi

sharedVolume:
  enabled: false
  mountPath: /app/shared
  size: 1Gi

ingress:
  enabled: true
  className: "nginx"
  annotations:
    kubernetes.io/ingress.class: nginx
    kubernetes.io/tls-acme: "true"
  hosts:
    - host: ospo-app.local
      paths:
        - path: /
          pathType: Prefix
  tls: []
EOF
echo -e "${GREEN}Helm chart values updated successfully.${NC}"

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