#!/bin/sh
set -e

# Create app directory structure
mkdir -p /app/client/src
mkdir -p /app/client/public
mkdir -p /app/server/dist
mkdir -p /app/shared
mkdir -p /app/public/uploads

# Function to copy current git codebase to Kubernetes pod
copy_current_repo() {
  echo "Copying current repository code to container..."
  
  # Files that must exist
  if [ -f "/app-source/package.json" ]; then
    cp -v /app-source/package.json /app/
  fi
  
  if [ -f "/app-source/tsconfig.json" ]; then
    cp -v /app-source/tsconfig.json /app/
  fi
  
  # Client files
  if [ -d "/app-source/client" ]; then
    cp -rv /app-source/client/* /app/client/
  fi
  
  # Server files
  if [ -d "/app-source/server" ]; then
    cp -rv /app-source/server/* /app/server/
  fi
  
  # Shared schema
  if [ -d "/app-source/shared" ]; then
    cp -rv /app-source/shared/* /app/shared/
  fi
  
  # Built files if available
  if [ -d "/app-source/dist" ]; then
    cp -rv /app-source/dist/* /app/dist/
  fi
  
  if [ -d "/app-source/public" ]; then
    cp -rv /app-source/public/* /app/public/
  fi
}

# Setup uploads directory permissions
setup_uploads() {
  mkdir -p /app/public/uploads
  chmod -R 777 /app/public/uploads
  echo "Uploads directory created with proper permissions"
}

# Install all required dependencies
install_dependencies() {
  cd /app
  echo "Installing application dependencies..."
  
  # If we have a working project with all dependencies
  if [ -f "package.json" ]; then
    npm install --omit=dev || npm install --no-save express @neondatabase/serverless drizzle-orm express-fileupload express-session
  else
    # Create minimal package.json if missing
    echo "Creating minimal package.json..."
    cat > package.json << 'EOF'
{
  "name": "ospo-events-app",
  "version": "1.0.0",
  "main": "server/dist/index.js",
  "scripts": {
    "start": "node server/dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@neondatabase/serverless": "^0.6.0",
    "drizzle-orm": "^0.28.1",
    "express-session": "^1.17.3",
    "express-fileupload": "^1.4.0",
    "ws": "^8.13.0"
  }
}
EOF
    npm install
  fi
  
  # If the server/dist directory is empty, copy fallback implementation
  if [ ! -f "/app/server/dist/index.js" ] && [ -f "/app-code/server_dist_index.js" ]; then
    echo "Copying fallback server implementation..."
    cp -v /app-code/server_dist_index.js /app/server/dist/index.js
  fi
  
  # If shared schema is missing, copy fallback
  if [ ! -f "/app/shared/schema.js" ] && [ -f "/app-code/shared_schema.js" ]; then
    echo "Copying fallback schema implementation..."
    cp -v /app-code/shared_schema.js /app/shared/schema.js
  fi
}

# Create fallback index.html if needed
create_fallback_html() {
  if [ ! -f "/app/public/index.html" ]; then
    echo "Creating fallback index.html..."
    mkdir -p /app/public
    cat > /app/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OSPO Events App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>OSPO Events Management</h1>
    <p>Application running in Kubernetes production mode.</p>
    <div id="app">Loading application...</div>
  </div>
</body>
</html>
EOF
  fi
}

# Main application bootstrapping
bootstrap_app() {
  echo "Starting application bootstrap process..."
  
  # First try to copy from mounted volume
  copy_current_repo
  
  # Setup upload directory
  setup_uploads
  
  # Install dependencies
  install_dependencies
  
  # Create fallback HTML
  create_fallback_html
  
  echo "Application bootstrap complete!"
}

# Execute bootstrap
bootstrap_app