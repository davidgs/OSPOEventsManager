#!/bin/bash

echo "Checking port availability for OSPO Event Management..."
echo "=================================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    
    if command -v lsof > /dev/null; then
        result=$(lsof -i :$port 2>/dev/null)
    elif command -v netstat > /dev/null; then
        result=$(netstat -tulpn | grep :$port 2>/dev/null)
    elif command -v ss > /dev/null; then
        result=$(ss -tulpn | grep :$port 2>/dev/null)
    else
        echo "No port checking tools available"
        return
    fi
    
    if [ -n "$result" ]; then
        echo "❌ Port $port ($service) is already in use:"
        echo "$result"
        echo ""
    else
        echo "✅ Port $port ($service) is available"
    fi
}

# Check all required ports
check_port 4576 "Nginx Proxy"
check_port 5555 "OSPO App"
check_port 8080 "Keycloak"
check_port 5432 "PostgreSQL"

echo ""
echo "Docker Compose Commands:"
echo "========================"
echo "To stop all services:   docker-compose --env-file .env.docker down --volumes"
echo "To start fresh:         docker-compose --env-file .env.docker up --build"
echo "To view logs:           docker-compose --env-file .env.docker logs -f"
echo ""
echo "Access URLs (when running):"
echo "============================"
echo "Main Application:       http://localhost:4576"
echo "Direct App Access:      http://localhost:5555"
echo "Keycloak Admin:         http://localhost:8080/auth/admin"
echo "Database (internal):    localhost:5432"