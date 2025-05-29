#!/bin/bash

# OSPO Application Docker Compose Startup Script

echo "🚀 Starting OSPO Application with Docker Compose"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create .env file from template if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "⚠️  Please review and update the .env file with your configuration"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

echo "📊 PostgreSQL:"
docker-compose exec postgres pg_isready -U ospo_user -d ospo_events || echo "❌ PostgreSQL not ready"

echo "🔐 Keycloak:"
curl -s -f http://localhost:8080/auth/health/ready > /dev/null && echo "✅ Keycloak ready" || echo "❌ Keycloak not ready"

echo "🌐 Application:"
curl -s -f http://localhost:5000/api/health > /dev/null && echo "✅ Application ready" || echo "❌ Application not ready"

echo "🔄 Nginx Proxy:"
curl -s -f http://localhost:4576/health > /dev/null && echo "✅ Nginx ready" || echo "❌ Nginx not ready"

echo ""
echo "🎉 Services Status:"
docker-compose ps

echo ""
echo "🔗 Access URLs:"
echo "   Application:     http://localhost:4576"
echo "   Direct App:      http://localhost:5000"
echo "   Keycloak Admin:  http://localhost:8080/auth/admin"
echo "   PgAdmin:         http://localhost:5050 (development only)"
echo ""
echo "👤 Default Credentials:"
echo "   Keycloak Admin:  admin / admin"
echo "   Test User:       admin / admin123"
echo "   Test Reviewer:   reviewer / reviewer123"
echo "   PgAdmin:         admin@ospo.example.com / admin123"
echo ""
echo "📝 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop:      docker-compose down"
echo "🔄 To restart:   docker-compose restart [service-name]"