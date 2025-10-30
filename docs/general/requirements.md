# System Requirements

## Deployment Requirements

### OpenShift/Kubernetes Cluster
- **OpenShift 4.x** or compatible Kubernetes cluster
- **Access**: Cluster admin or namespace admin permissions
- **CLI Tools**: `oc` (OpenShift CLI) installed and authenticated

### Infrastructure
- **Persistent Storage**: Support for PersistentVolumeClaims (PVCs)
  - PostgreSQL: 10Gi
  - Application uploads: 10Gi
  - Total: ~20Gi minimum
- **Ingress/Routes**: Ability to create routes with custom domains
- **TLS Certificates**: Let's Encrypt or custom certificates

### Resource Requirements

#### Production Environment
**PostgreSQL**:
- CPU: 100m request, 500m limit
- Memory: 256Mi request, 512Mi limit

**Keycloak**:
- CPU: 200m request, 1000m limit
- Memory: 512Mi request, 1Gi limit

**Application**:
- CPU: 100m request, 500m limit
- Memory: 256Mi request, 512Mi limit
- Replicas: 1-3 (auto-scaling)

**Total Minimum**:
- CPU: ~400m requests, ~2 cores limits
- Memory: ~1Gi requests, ~2Gi limits

#### Development Environment
- Lower resource limits
- Single replica
- Similar storage requirements

## Software Requirements

### Server-Side
- **Node.js**: 20.x or higher
- **PostgreSQL**: 16.x
- **Keycloak**: 23.0.6
- **Docker**: For building container images

### Client-Side (End Users)
- **Modern web browser**:
  - Chrome/Chromium 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **JavaScript**: Must be enabled
- **Cookies**: Must be enabled for authentication
- **Internet connection**: Required for application access

## Browser Requirements

### Supported Browsers
✅ **Desktop**:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

✅ **Mobile**:
- iOS Safari (14+)
- Chrome Mobile (latest)
- Firefox Mobile (latest)

### Browser Features Required
- JavaScript (ES6+)
- WebSockets (for real-time features)
- LocalStorage
- Cookies
- CSS Grid and Flexbox

## Network Requirements

### Ports
- **Application**: 4576 (internal)
- **PostgreSQL**: 5432 (internal)
- **Keycloak**: 8080 (internal)
- **External Access**: 443 (HTTPS)

### DNS
- Custom domain support (e.g., `rh-events.org`)
- Subdomain support (e.g., `keycloak-prod.rh-events.org`)

### Firewall
- Outbound HTTPS (443) for:
  - Let's Encrypt certificate validation
  - Docker Hub (image pulls)
  - NPM registry (if building from source)

## Security Requirements

### Authentication
- **Keycloak**: Identity and access management
- **OpenID Connect**: OAuth 2.0 / OIDC support
- **JWT**: JSON Web Token validation

### Encryption
- **TLS/HTTPS**: Required for all external communication
- **Database**: SSL/TLS connections (optional but recommended)

### Certificates
- **Let's Encrypt**: Automatic certificate generation
- **Custom Certificates**: Support for importing certificates

## Development Requirements

### Local Development
Currently, local development is **not supported**. The application requires:
- OpenShift/Kubernetes environment
- PostgreSQL database
- Keycloak server

### Development Tools
If contributing to the project:
- **Node.js**: 20.x
- **npm**: 10.x or higher
- **Git**: For version control
- **Text Editor/IDE**: VS Code, WebStorm, etc.
- **OpenShift CLI**: For deployment

## Optional Components

### MinIO Object Storage
- Currently configured but not integrated
- Can be used for S3-compatible file storage
- Storage: 20Gi if enabled

### AI Features (Ollama)
- Currently disabled in deployment
- Can be enabled for AI-powered features
- Requires GPU support for optimal performance

## Minimum vs Recommended

### Minimum (Development)
- 2 CPU cores
- 2Gi RAM
- 20Gi storage
- Single namespace

### Recommended (Production)
- 4+ CPU cores
- 4Gi+ RAM
- 50Gi+ storage
- Separate dev/prod namespaces
- Auto-scaling enabled
- Backup strategy
- Monitoring/logging

## Performance Considerations

### Expected Load
- **Concurrent Users**: 10-100
- **Events**: Up to 1000 events
- **File Uploads**: Up to 50MB per file
- **Database**: Moderate transactional load

### Scaling
- Horizontal: Application pods can scale 1-3 replicas
- Vertical: Adjust resource limits as needed
- Storage: PVCs can be expanded

## Compatibility

### Data Formats
- **Import**: CSV for events
- **Export**: CSV, Excel
- **Files**: PDF, DOCX, XLSX, images, etc.

### API
- RESTful HTTP/JSON API
- OpenAPI/Swagger compatible (future)

---

For deployment instructions, see the [Deployment Guide](../developer/deployment.md).

For configuration options, see [Configuration Guide](../developer/configuration.md).

