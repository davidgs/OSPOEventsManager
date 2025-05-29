# OSPO Event Management - Docker Compose Setup

This guide explains how to run the OSPO Event Management application using Docker Compose, which provides a much simpler and more reliable deployment compared to Kubernetes.

## Quick Start

1. **Start the application:**
   ```bash
   ./start-docker.sh
   ```

2. **Access the application:**
   - Main Application: http://localhost:4576
   - Direct App Access: http://localhost:5000
   - Keycloak Admin: http://localhost:8080/auth/admin
   - PgAdmin (dev): http://localhost:5050

## Architecture

The Docker Compose setup includes:

- **PostgreSQL Database** (port 5432)
- **Keycloak Authentication Server** (port 8080)
- **OSPO Application** (port 5000)
- **Nginx Reverse Proxy** (port 80)
- **PgAdmin** (port 5050, development only)

## Services

### PostgreSQL Database
- Stores all application data
- Pre-configured with OSPO database schema
- Persistent data storage using Docker volumes

### Keycloak Authentication
- Handles user authentication and authorization
- Pre-configured with OSPO realm and test users
- Runs in development mode for easier testing

### OSPO Application
- Main Node.js/Express application
- Connects to PostgreSQL for data persistence
- Integrates with Keycloak for authentication

### Nginx Proxy
- Routes traffic to appropriate services
- Handles `/auth/*` requests to Keycloak
- Handles all other requests to the OSPO application

## Configuration

### Environment Variables

Copy `.env.docker` to `.env` and customize as needed:

```bash
cp .env.docker .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `KEYCLOAK_CLIENT_SECRET`: Keycloak client secret
- `SESSION_SECRET`: Express session secret

### Default Credentials

**Keycloak Admin:**
- Username: `admin`
- Password: `admin`

**Test Users:**
- Admin User: `admin` / `admin123`
- Reviewer User: `reviewer` / `reviewer123`

**PgAdmin:**
- Email: `admin@ospo.example.com`
- Password: `admin123`

## Development

### Running in Development Mode

The `docker-compose.override.yml` file automatically configures development settings:

```bash
# Start in development mode
docker-compose up

# View logs
docker-compose logs -f ospo-app

# Restart a specific service
docker-compose restart ospo-app
```

### Database Access

**Via PgAdmin:**
1. Open http://localhost:5050
2. Login with PgAdmin credentials
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `ospo_events`
   - Username: `ospo_user`
   - Password: `ospo_password123`

**Via Command Line:**
```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U ospo_user -d ospo_events

# Run SQL commands
docker-compose exec postgres psql -U ospo_user -d ospo_events -c "SELECT * FROM users;"
```

## Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View service status
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f ospo-app
```

### Maintenance
```bash
# Rebuild services
docker-compose up --build

# Remove all data (destructive!)
docker-compose down -v

# Update a single service
docker-compose up -d --no-deps ospo-app

# Scale a service (if needed)
docker-compose up -d --scale ospo-app=2
```

### Database Operations
```bash
# Backup database
docker-compose exec postgres pg_dump -U ospo_user ospo_events > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ospo_user ospo_events < backup.sql

# Reset database
docker-compose down
docker volume rm ospo-app_postgres_data
docker-compose up -d
```

## Troubleshooting

### Service Health Checks
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U ospo_user -d ospo_events

# Check Keycloak
curl -f http://localhost:8080/auth/health/ready

# Check Application
curl -f http://localhost:5000/api/health

# Check Nginx
curl -f http://localhost/health
```

### Common Issues

**Services not starting:**
1. Check Docker is running: `docker info`
2. Check ports are available: `netstat -tulpn | grep :4576`
3. View service logs: `docker-compose logs [service-name]`

**Database connection issues:**
1. Verify PostgreSQL is healthy: `docker-compose ps`
2. Check environment variables: `docker-compose config`
3. Restart services in order: `docker-compose restart postgres keycloak ospo-app`

**Keycloak authentication issues:**
1. Verify Keycloak is accessible: http://localhost:8080/auth
2. Check realm configuration in Keycloak admin
3. Verify client secret matches environment variable

### Performance Tuning

For production deployments, consider:

1. **Resource Limits:**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

2. **Health Check Intervals:**
   ```yaml
   healthcheck:
     interval: 60s
     timeout: 10s
     retries: 3
   ```

3. **PostgreSQL Configuration:**
   - Tune `shared_buffers`, `work_mem`
   - Enable connection pooling

## Security Considerations

For production use:

1. Change all default passwords
2. Use proper SSL/TLS certificates
3. Configure Keycloak for production mode
4. Set up proper network policies
5. Use secrets management instead of environment variables
6. Enable PostgreSQL SSL connections

## Monitoring

Add monitoring services to docker-compose.yml:

```yaml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
```

## Next Steps

1. Customize the Keycloak realm configuration
2. Add your organization's users and roles
3. Configure SSL/TLS for production
4. Set up automated backups
5. Implement monitoring and logging
6. Deploy to production environment