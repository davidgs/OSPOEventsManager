#!/bin/bash

# Geocoding Runner Script for OpenShift Cluster
# This script runs the geocoding process on the cluster where the database is accessible

set -e

echo "🌍 OSPO Events Geocoding Runner"
echo "=============================="
echo ""

# Check if we're in the right environment
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
    echo "❌ No DATABASE_URL or POSTGRES_URL found in environment"
    echo "💡 This script should be run inside the OpenShift cluster pod"
    echo ""
    echo "To run this on the cluster:"
    echo "  1. Copy the script to the running pod:"
    echo "     oc cp geocode-runner.sh <pod-name>:/app/"
    echo "  2. Execute it in the pod:"
    echo "     oc exec <pod-name> -- /app/geocode-runner.sh"
    echo ""
    exit 1
fi

echo "✅ Database connection available"
echo "🔗 Database URL: ${DATABASE_URL:-$POSTGRES_URL}"
echo ""

# Check if required dependencies are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

echo "📦 Installing/checking dependencies..."
npm install --production=false

echo ""
echo "🧪 Testing geocoding on sample events first..."
echo "=============================================="
npm run geocode:test

echo ""
echo "🤔 Do you want to proceed with geocoding all events? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🚀 Starting full geocoding process..."
    echo "===================================="
    npm run geocode
else
    echo "❌ Geocoding cancelled by user"
    exit 0
fi

echo ""
echo "🎉 Geocoding process completed!"
echo "Check the output above for success/failure statistics."
