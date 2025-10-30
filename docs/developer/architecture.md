# Architecture Overview

This document provides a comprehensive overview of the OSPO Events Manager architecture.

## System Architecture

OSPO Events Manager is a full-stack web application deployed on OpenShift with the following architecture:

```
┌─────────────────────────────────────────────────────────┐
│                   OpenShift Cluster                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            External Access (HTTPS/TLS)            │  │
│  │  Custom Domains: *.rh-events.org                 │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │          Application Pod (ospo-app)              │  │
│  │  - Node.js + Express.js                          │  │
│  │  - React Frontend (SSR)                          │  │
│  │  - Keycloak Auth Middleware                      │  │
│  │  Port: 4576                                      │  │
│  └────────┬──────────────────────┬──────────────────┘  │
│           │                      │                      │
│  ┌────────▼────────┐    ┌───────▼─────────┐           │
│  │   PostgreSQL    │    │    Keycloak     │           │
│  │   Database      │    │  Auth Server    │           │
│  │   Port: 5432    │    │  Port: 8080     │           │
│  └─────────────────┘    └─────────────────┘           │
│                                                          │
│  Persistent Storage: PVCs for data persistence          │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library
- **Keycloak JS**: Authentication client
- **TanStack Query**: Data fetching and caching

### Backend
- **Node.js 20**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **Keycloak Connect**: Server-side authentication
- **Drizzle ORM**: Type-safe database access
- **express-fileupload**: File handling
- **Helmet**: Security headers
- **express-rate-limit**: Rate limiting

### Database
- **PostgreSQL 16**: Relational database
- **Drizzle ORM**: Database toolkit
- Tables: users, events, cfp_submissions, attendees, assets, stakeholders, approval_workflows

### Authentication
- **Keycloak 23.0.6**: Identity and access management
- **OpenID Connect**: Authentication protocol
- **OAuth 2.0**: Authorization framework
- **JWT**: Token-based authentication

### Infrastructure
- **OpenShift**: Kubernetes-based container platform
- **Docker**: Containerization
- **Let's Encrypt**: SSL/TLS certificates
- **PersistentVolumeClaims**: Data persistence

## Application Layers

### 1. Presentation Layer (Frontend)

**Location**: `client/src/`

**Components**:
- **Pages**: Route-level components (`pages/`)
- **Components**: Reusable UI components (`components/`)
- **Hooks**: Custom React hooks (`hooks/`)
- **Context**: State management (`contexts/`)
- **Services**: API clients (`lib/`)

**Key Files**:
- `client/src/main.tsx`: Application entry point
- `client/src/App.tsx`: Root component with routing
- `client/src/lib/keycloak.ts`: Authentication client

### 2. API Layer (Backend)

**Location**: `server/`

**Responsibilities**:
- Request routing
- Authentication/authorization
- Business logic
- Data validation
- File handling
- Error handling

**Key Files**:
- `server/index.ts`: Server initialization
- `server/routes.ts`: API endpoints (2300+ lines)
- `server/keycloak-config.ts`: Auth middleware
- `server/storage.ts`: Data access interface

### 3. Data Layer

**Location**: `server/db.ts`, `shared/database-schema.ts`

**Components**:
- Database connection pool
- ORM models (Drizzle)
- Query builders
- Migrations
- Schema definitions

**Key Tables**:
```sql
users             -- User accounts
events            -- Event information
cfp_submissions   -- Call for papers submissions
attendees         -- Event attendees
assets            -- Uploaded files
stakeholders      -- Stakeholder information
approval_workflows -- Approval processes
```

### 4. Security Layer

**Components**:
- **Network**: TLS termination, network policies
- **Application**: Helmet, CORS, rate limiting
- **Authentication**: Keycloak, JWT validation
- **Authorization**: Role-based access control
- **Data**: Parameterized queries, input validation
- **Files**: Type validation, size limits, sanitization

## Request Flow

### Unauthenticated Request
```
1. Browser → OpenShift Route (HTTPS)
2. Route → OSPO App Pod
3. Express Middleware Stack:
   - Helmet (security headers)
   - Rate Limiter
   - Session Management
   - Static File Server
4. → Return public content or redirect to login
```

### Authenticated API Request
```
1. Browser → OpenShift Route (HTTPS)
   Headers: Authorization: Bearer <token>

2. Route → OSPO App Pod

3. Express Middleware Stack:
   - Helmet (security headers)
   - Rate Limiter
   - Session Management
   - JSON Parser
   - Keycloak Auth Middleware
     ├─ Extract token
     ├─ Validate with Keycloak
     ├─ Verify signature
     └─ Extract user info

4. Route Handler (server/routes.ts)
   ├─ Validate input
   ├─ Check permissions
   └─ Execute business logic

5. Storage Layer (server/storage.ts)
   └─ Database operations via Drizzle ORM

6. PostgreSQL Database
   └─ Execute query and return results

7. Response
   ├─ Format data
   ├─ Add security headers
   └─ Return JSON

8. Browser receives response
```

## Authentication Flow

```
1. User visits application
   └─ Keycloak JS checks for valid token

2. No valid token found
   └─ Redirect to Keycloak login
       URL: /auth/realms/ospo-events/protocol/openid-connect/auth

3. User enters credentials
   └─ Keycloak validates credentials

4. Keycloak issues tokens
   ├─ ID Token (user info)
   ├─ Access Token (API access)
   └─ Refresh Token (token renewal)

5. Redirect back to application
   └─ Keycloak JS stores tokens

6. Application makes API requests
   └─ Authorization: Bearer <access_token>

7. Server validates token
   ├─ Check signature
   ├─ Verify expiration
   ├─ Extract user claims
   └─ Check roles/permissions

8. Token refresh (before expiry)
   └─ Keycloak JS auto-refreshes
```

## Data Model

### Core Entities

#### Users
- Authenticated via Keycloak
- Stored in database for relationships
- Roles: user, reviewer, admin

#### Events
- Core entity for event management
- Status: planning, confirmed, active, completed, cancelled
- Priority: high, medium, low
- Types: conference, meetup, workshop, webinar, etc.

#### CFP Submissions
- Linked to events
- Submitted by users
- Reviewed by reviewers
- Status: submitted, under review, accepted, rejected, waitlisted

#### Assets
- Files uploaded by users
- Associated with events or submissions
- Types: abstract, presentation, document, image, etc.
- Stored in PVC at `/app/uploads`

### Relationships

```
users (1) ──< (N) events (created_by_id)
users (1) ──< (N) cfp_submissions (submitter_id)
events (1) ──< (N) cfp_submissions (event_id)
events (1) ──< (N) attendees (event_id)
events (1) ──< (N) assets (event_id)
users (1) ──< (N) assets (uploaded_by)
cfp_submissions (1) ──< (N) assets (cfp_submission_id)
```

## Deployment Architecture

### Development Environment
- Namespace: `dev-rh-events-org`
- URL: `https://dev.rh-events.org`
- Keycloak: `https://keycloak-dev.rh-events.org`
- Resources: Lower limits, single replica
- Purpose: Development and testing

### Production Environment
- Namespace: `prod-rh-events-org`
- URL: `https://rh-events.org`
- Keycloak: `https://keycloak-prod.rh-events.org`
- Resources: Higher limits, auto-scaling (1-3 replicas)
- Purpose: Live production use

### Persistent Storage

**PostgreSQL Data**: 10Gi PVC
- Database files
- Transaction logs
- Keycloak data

**Application Uploads**: 10Gi PVC
- User-uploaded files
- Asset storage
- Mounted at `/app/uploads`

## Security Architecture

### Defense in Depth

**Layer 1: Network Security**
- TLS/HTTPS encryption
- OpenShift network policies
- Ingress/egress rules
- Custom domain with Let's Encrypt certificates

**Layer 2: Application Security**
- Helmet security headers
- Content Security Policy (CSP)
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Input validation and sanitization

**Layer 3: Authentication**
- Keycloak with OpenID Connect
- JWT token validation
- Token signature verification
- Automatic token refresh
- Session management

**Layer 4: Authorization**
- Role-based access control (RBAC)
- Resource ownership checks
- Permission validation per request
- Admin-only endpoints

**Layer 5: Data Security**
- Parameterized queries (SQL injection prevention)
- Drizzle ORM type safety
- Database user permissions
- Encrypted connections

**Layer 6: File Security**
- File type validation (whitelist)
- File size limits (50MB)
- Filename sanitization
- Path traversal prevention
- Virus scanning capability (configurable)

## Scaling Considerations

### Horizontal Scaling
- Application pods: Auto-scale 1-3 replicas
- Load balancing via OpenShift routes
- Stateless application design
- Session storage in database

### Vertical Scaling
- Configurable resource limits
- CPU/Memory requests and limits
- Database connection pooling

### Storage Scaling
- PVCs can be expanded
- Object storage migration path (MinIO ready)

### Caching Strategy
- Client-side: TanStack Query
- Server-side: Consider Redis for sessions (future)

## Monitoring & Observability

### Logs
- Application logs via console.log
- OpenShift pod logs
- Keycloak logs

### Health Checks
- Liveness probe: `/api/health`
- Readiness probe: `/api/health`
- Startup probe: `/api/health`

### Metrics
- OpenShift built-in metrics
- Resource usage tracking
- Request rate monitoring

## Development Workflow

1. **Local Development**: Not currently supported (requires OpenShift)
2. **Development Environment**: Deploy to dev namespace
3. **Testing**: Manual testing in dev environment
4. **Production Deployment**: Deploy to prod namespace via `deploy.sh`

## Future Architecture Considerations

### Potential Enhancements
- **MinIO Integration**: Migrate to S3-compatible object storage
- **Redis Caching**: Add caching layer for sessions and frequently accessed data
- **Message Queue**: Add async processing for emails, notifications
- **Microservices**: Split into smaller services if needed
- **GraphQL API**: Consider GraphQL for flexible data fetching
- **Elasticsearch**: Add full-text search capabilities
- **Monitoring Stack**: Prometheus + Grafana for metrics
- **CI/CD Pipeline**: Automated testing and deployment

### Performance Optimization
- Database indexing review
- Query optimization
- Asset CDN for static files
- Lazy loading and code splitting
- Service worker for offline capability

---

For more detailed information, see:
- [Database Schema](database.md)
- [API Documentation](api.md)
- [Security Best Practices](security.md)
- [Deployment Guide](deployment.md)

