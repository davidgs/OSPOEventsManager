/**
 * Simple development server script
 * This provides a direct way to run the application outside of Kubernetes
 */
const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');

// Ensure uploads directory exists
if (!existsSync('./public/uploads')) {
  mkdirSync('./public/uploads', { recursive: true });
}

// Set environment variables
process.env.PORT = "3000";
process.env.HOST = "0.0.0.0";
process.env.VITE_SERVE_CLIENT = "true";
process.env.NODE_ENV = "development";

console.log('Starting development server on port 3000...');
console.log('App will be available at: http://localhost:3000');

// Start the server directly with tsx
try {
  execSync('npx tsx server/index.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}