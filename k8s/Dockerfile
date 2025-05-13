FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the client application
RUN npm run build

# Create a production image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install production dependencies
COPY package*.json ./
# Install all dependencies including dev since we need vite at runtime
RUN npm ci

# Install TypeScript execution tools
RUN npm install -g tsx

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/keycloak.json ./keycloak.json

# Create uploads directory
RUN mkdir -p /app/public/uploads && chmod -R 777 /app/public/uploads

# Create a separate directory for the Vite static files and ensure it has the content
RUN mkdir -p /app/server/public && cp -r /app/dist/* /app/server/public/ && \
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" /></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script><script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script></body></html>' > /app/server/public/index.html && \
    ls -la /app/server/public/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0
ENV VITE_SERVE_CLIENT=true

# Expose the port
EXPOSE 5000

# Command to run the application
CMD ["sh", "-c", "echo \"Starting application on port $PORT...\" && tsx server/index.ts"]