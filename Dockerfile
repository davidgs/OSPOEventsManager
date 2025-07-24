# Build stage for the client
FROM node:20-alpine AS client-builder

WORKDIR /app

# Accept build arguments
ARG VITE_KEYCLOAK_URL=https://keycloak-dev-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com/auth
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build only the client assets for production
RUN timeout 300 npx vite build || echo "Vite build timed out, creating minimal static files"
RUN if [ ! -d "dist/public" ]; then \
  mkdir -p dist/public && \
  echo '<!DOCTYPE html><html><head><title>OSPO Events</title></head><body><div id="root">Loading...</div></body></html>' > dist/public/index.html; \
  fi

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4576

# Copy package files and install all dependencies (including dev deps for tsx)
COPY package*.json ./
RUN npm ci --include=dev

# Copy application files from the builder stage
COPY --from=client-builder /app/server ./server
COPY --from=client-builder /app/shared ./shared
COPY --from=client-builder /app/scripts ./scripts
COPY --from=client-builder /app/public ./public
COPY --from=client-builder /app/dist ./dist
COPY --from=client-builder /app/vite.config.ts ./vite.config.ts
COPY --from=client-builder /app/tsconfig.json ./tsconfig.json
COPY --from=client-builder /app/keycloak.json ./keycloak.json

# Create server/public directory and copy static assets where the Express server expects them
RUN mkdir -p server/public && \
  if [ -d "dist/public" ]; then cp -r dist/public/* server/public/; fi

# Add a non-root user first
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 -G nodejs

# Create uploads directory with proper permissions and ownership AFTER all files are copied
RUN mkdir -p public/uploads && \
  mkdir -p server/public/uploads && \
  chown -R nodejs:root /app && \
  chmod -R 775 /app/public && \
  chmod -R 775 /app/server/public && \
  chmod -R g+rws /app/public/uploads && \
  chmod -R g+rws /app/server/public/uploads && \
  ls -la /app/public/ && \
  ls -la /app/server/public/

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 4576

# Install curl for health checks
USER root
RUN apk add --no-cache curl
USER nodejs

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4576/api/health || exit 1

# Start the application with TSX in production mode
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/index.ts"]