#!/bin/bash
set -e

# Script to deploy the OSPO Events App using a direct Docker container approach
# This is an alternative to Helm charts for simpler deployments

# Variables
APP_NAME="ospo-events-app"
DB_NAME="ospo-postgres"
NETWORK_NAME="ospo-network"

# Build the application image
echo "Building application Docker image..."
docker build -t ${APP_NAME}:latest -f Dockerfile.prod .

# Create Docker network if it doesn't exist
if ! docker network inspect ${NETWORK_NAME} >/dev/null 2>&1; then
  echo "Creating Docker network ${NETWORK_NAME}..."
  docker network create ${NETWORK_NAME}
else
  echo "Network ${NETWORK_NAME} already exists."
fi

# Start PostgreSQL container if it's not already running
if ! docker ps --filter "name=${DB_NAME}" --format '{{.Names}}' | grep -q ${DB_NAME}; then
  echo "Starting PostgreSQL container..."
  docker run -d \
    --name ${DB_NAME} \
    --network ${NETWORK_NAME} \
    -e POSTGRES_USER=ospo_user \
    -e POSTGRES_PASSWORD=ospo_password123 \
    -e POSTGRES_DB=ospo_db \
    -v ospo-postgres-data:/var/lib/postgresql/data \
    postgres:14-alpine
else
  echo "PostgreSQL container is already running."
fi

# Start the application container
echo "Starting OSPO Events App container..."
docker run -d \
  --name ${APP_NAME} \
  --network ${NETWORK_NAME} \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://ospo_user:ospo_password123@${DB_NAME}:5432/ospo_db" \
  -v ospo-uploads:/app/public/uploads \
  ${APP_NAME}:latest

echo "Containers started. Waiting for the application to initialize..."
sleep 5

# Check if the application is running
if docker ps --filter "name=${APP_NAME}" --format '{{.Status}}' | grep -q "Up"; then
  echo "Application is running!"
  echo "You can access it at http://localhost:5000"
  
  # Show container logs
  echo "Application logs:"
  docker logs --tail 20 ${APP_NAME}
else
  echo "ERROR: Application failed to start."
  echo "Container logs:"
  docker logs ${APP_NAME}
  exit 1
fi

echo "Deployment completed successfully."