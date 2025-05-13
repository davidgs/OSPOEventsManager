FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Install TypeScript compilation tools
RUN npm install -g tsx typescript

# Create uploads directory
RUN mkdir -p /app/public/uploads && chmod -R 777 /app/public/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Command to run the application
CMD ["tsx", "server/index.ts"]