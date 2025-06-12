# Docker Port Binding Troubleshooting

## Common Issues When Ports Don't Show in Docker Desktop

### 1. Port Conflicts
The most likely cause is that required ports are already in use on your local machine.

**Check which ports are in use:**
```bash
# On macOS/Linux:
lsof -i :8080  # Keycloak
lsof -i :5555  # OSPO App  
lsof -i :4576  # Nginx
lsof -i :5432  # PostgreSQL

# On Windows:
netstat -ano | findstr :8080
netstat -ano | findstr :5555
netstat -ano | findstr :4576
netstat -ano | findstr :5432
```

### 2. Docker Compose Environment Loading
Ensure you're using the correct environment file:

```bash
# Stop any existing containers
docker-compose --env-file .env.docker down --volumes --remove-orphans

# Start fresh with explicit environment file
docker-compose --env-file .env.docker up --build
```

### 3. Alternative Port Configuration
If ports are in use, modify docker-compose.yml temporarily:

```yaml
services:
  keycloak:
    ports:
      - "8081:8080"  # Change external port
  
  ospo-app:
    ports:
      - "5556:5555"  # Change external port
  
  nginx:
    ports:
      - "4577:80"    # Change external port
```

### 4. Docker Desktop Issues
Sometimes Docker Desktop needs to be restarted:

1. Quit Docker Desktop completely
2. Restart Docker Desktop
3. Wait for it to fully initialize
4. Try docker-compose again

### 5. Check Container Logs
View logs to see binding errors:

```bash
docker-compose --env-file .env.docker logs keycloak
docker-compose --env-file .env.docker logs ospo-app
docker-compose --env-file .env.docker logs nginx
```

### 6. Network Conflicts
Reset Docker networks if needed:

```bash
docker network prune
docker system prune -f
```

## Expected Working State

When working correctly, you should see:
- **Port 4576** → Main application access
- **Port 5555** → Direct OSPO app access  
- **Port 8080** → Keycloak authentication
- **Port 5432** → PostgreSQL database

Access the application at: **http://localhost:4576**