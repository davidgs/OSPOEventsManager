# Build stage for the client
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build only the client application (skip server bundling)
RUN npx vite build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5555

# Copy package files and install all dependencies (including dev deps for tsx)
COPY package*.json ./
RUN npm ci --include=dev

# Copy built assets from the builder stage
COPY --from=client-builder /app/server ./server
COPY --from=client-builder /app/shared ./shared
COPY --from=client-builder /app/public ./public
COPY --from=client-builder /app/vite.config.ts ./vite.config.ts
COPY --from=client-builder /app/tsconfig.json ./tsconfig.json
# Copy built client assets to where static server expects them
COPY --from=client-builder /app/dist ./server/public

# Create uploads directory
RUN mkdir -p public/uploads

# Add a non-root user and change ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 5555

# Install curl for health checks
USER root
RUN apk add --no-cache curl
USER nodejs

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5555/api/health || exit 1

# Start the application directly with tsx in production mode
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/index.ts"]