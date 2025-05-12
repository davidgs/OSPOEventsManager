#!/bin/bash
# Script to prepare the OSPO application for Kubernetes deployment

set -e

echo "Preparing OSPO Event Management Application for Kubernetes deployment..."

# Ensure we're in the project root
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root directory"
  exit 1
fi

# Create production build
echo "Creating production build..."
npm run build

# Create Docker image (if Docker is available)
if command -v docker &> /dev/null; then
  echo "Building Docker image..."
  
  # Create Dockerfile if it doesn't exist
  if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << EOL
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy built app
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Run the application
CMD ["npm", "start"]
EOL
    echo "Created Dockerfile"
  fi
  
  # Build the Docker image
  docker build -t ospo-app:latest .
  
  echo "Docker image built successfully"
  echo "You can now push this image to your container registry:"
  echo "  docker tag ospo-app:latest your-registry/ospo-app:latest"
  echo "  docker push your-registry/ospo-app:latest"
else
  echo "Docker not found. Skipping Docker image creation."
  echo "To build a Docker image later, install Docker and run:"
  echo "  docker build -t ospo-app:latest ."
fi

# Update Helm chart values if needed
echo ""
echo "Updating Helm chart values..."

# Prompt for domain name
read -p "Enter your domain name for the application (e.g., ospo-app.example.com): " domain_name
if [ -n "$domain_name" ]; then
  sed -i "s/host: ospo-app.example.com/host: $domain_name/" k8s/charts/ospo-app/values.yaml
  echo "Updated domain name to $domain_name"
fi

# Prompt for GitHub repository URL
read -p "Enter your GitHub repository URL (e.g., https://github.com/your-org/ospo-app.git): " repo_url
if [ -n "$repo_url" ]; then
  sed -i "s|url: https://github.com/your-org/ospo-app.git|url: $repo_url|" k8s/charts/ospo-app/values.yaml
  echo "Updated repository URL to $repo_url"
fi

echo ""
echo "Deployment preparation complete!"
echo ""
echo "To deploy to Kubernetes, use the Helm chart:"
echo "  cd k8s"
echo "  helm install ospo-app ./charts/ospo-app"
echo ""
echo "For more information, see k8s/README.md"