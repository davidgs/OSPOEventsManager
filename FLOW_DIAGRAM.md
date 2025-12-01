# Events Manager - Application Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OpenShift Cluster                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Production/Dev Namespace                         │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    External Access Layer                     │   │    │
│  │  │                                                              │   │    │
│  │  │  ┌─────────────────────┐      ┌──────────────────────┐       │   │    │
│  │  │  │  Custom Domain      │      │   Custom Domain      │       │   │    │
│  │  │  │  Route (TLS Edge)   │      │  Route (TLS Edge)    │       │   │    │
│  │  │  │                     │      │                      │       │   │    │
│  │  │  │ *.rh-events.org     │      │ keycloak-prod.       │       │   │    │
│  │  │  │ dev.rh-events.org   │      │ rh-events.org        │       │   │    │
│  │  │  └──────────┬──────────┘      └──────────┬───────────┘       │   │    │
│  │  └─────────────┼─────────────────────────────┼──────────────────┘   │    │
│  │                │                             │                      │    │
│  │  ┌─────────────▼─────────────────────────────▼──────────────────┐   │    │
│  │  │                  Application Layer                           │   │    │
│  │  │                                                              │   │    │
│  │  │  ┌──────────────────────────┐    ┌──────────────────────┐    │   │    │
│  │  │  │   App Service       │    │  Keycloak Service    │    │   │    │
│  │  │  │   (ospo-app)             │    │  (keycloak)          │    │   │    │
│  │  │  │   Port: 4576             │    │  Port: 8080          │    │   │    │
│  │  │  │                          │    │  /auth context       │    │   │    │
│  │  │  └────────┬─────────────────┘    └──────────┬───────────┘    │   │    │
│  │  └───────────┼──────────────────────────────────┼───────────────┘   │    │
│  │              │                                  │                   │    │
│  │  ┌───────────▼──────────────────────────────────▼───────────────┐   │    │
│  │  │                 Data & Storage Layer                         │   │    │
│  │  │                                                              │   │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │   │    │
│  │  │  │  PostgreSQL  │  │    MinIO     │  │  PersistentVolume │   │   │    │
│  │  │  │  (postgres)  │  │  (minio)     │  │  Claims (PVCs)    │   │   │    │
│  │  │  │  Port: 5432  │  │  Port: 9000  │  │                   │   │   │    │
│  │  │  │              │  │              │  │  - postgres-data  │   │   │    │
│  │  │  │  Databases:  │  │  Object      │  │  - keycloak-data  │   │   │    │
│  │  │  │  - ospo_evts │  │  Storage     │  │  - minio-data     │   │   │    │
│  │  │  │  - keycloak  │  │  for Files   │  │  - uploads        │   │   │    │
│  │  │  └──────────────┘  └──────────────┘  └───────────────────┘   │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## User Authentication Flow

```
┌────────────┐
│   User     │
│  Browser   │
└─────┬──────┘
      │
      │ 1. Access Application
      ▼
┌─────────────────────────────────────┐
│  App Frontend (React/Vite)     │
│  - React Router                     │
│  - Keycloak JS Client               │
└─────┬───────────────────────────────┘
      │
      │ 2. Initialize Keycloak
      │    keycloak.init({ onLoad: 'check-sso' })
      ▼
┌─────────────────────────────────────┐
│  Is user authenticated?             │
└─────┬───────────────┬───────────────┘
      │ No            │ Yes
      │               │
      │ 3. Redirect   │ 6. Load App
      ▼               ▼
┌─────────────────┐   ┌──────────────────────┐
│ Keycloak Login  │   │  Protected Routes    │
│  /auth/realms/  │   │  - Events            │
│  ospo-events/   │   │  - CFP Submissions   │
│  protocol/      │   │  - Attendees         │
│  openid-connect │   │  - Assets            │
└─────┬───────────┘   │  - User Profile      │
      │               └──────────────────────┘
      │ 4. Enter credentials
      │    or Register
      ▼
┌─────────────────┐
│  Keycloak Auth  │
│  Server         │
│  - Validates    │
│  - Issues Token │
└─────┬───────────┘
      │
      │ 5. Redirect with token
      │    to app callback
      ▼
┌─────────────────────────────────────┐
│  Keycloak JS Client                 │
│  - Stores token                     │
│  - Sets up auto-refresh             │
│  - Returns authenticated = true     │
└─────────────────────────────────────┘
```

## API Request Flow with Authentication

```
┌────────────────┐
│  React Client  │
│  Component     │
└────────┬───────┘
         │
         │ 1. User Action (e.g., Create Event)
         ▼
┌────────────────────────────────────┐
│  API Call with Bearer Token        │
│  fetch('/api/events', {            │
│    headers: {                      │
│      Authorization: 'Bearer xyz'   │
│    }                               │
│  })                                │
└────────┬───────────────────────────┘
         │
         │ 2. HTTP Request
         ▼
┌──────────────────────────────────────────────────────────┐
│  Express.js Server (server/index.ts)                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Middleware Stack (executed in order)              │  │
│  │                                                    │  │
│  │  1. Helmet (Security Headers, CSP)                 │  │
│  │  2. Rate Limiter (prevent abuse)                   │  │
│  │  3. Session Management                             │  │
│  │  4. JSON/URL Parsing                               │  │
│  │  5. Keycloak Proxy (/auth/* → keycloak:8080)       │  │
│  │  6. Static File Serving (/uploads)                 │  │
│  │  7. Request Logging                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Keycloak Auth Middleware (server/keycloak-cfg)    │  │
│  │                                                    │  │
│  │  - Extract Bearer token from header                │  │
│  │  - Validate token with Keycloak                    │  │
│  │  - Verify signature and expiration                 │  │
│  │  - Extract user info (id, email, roles)            │  │
│  │  - Attach to req.kauth / req.user                  │  │
│  └──────────────────┬─────────────────────────────────┘  │
│                     │                                    │
│                     │ 3. Token Valid?                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Route Handler (server/routes.ts)                  │  │
│  │                                                    │  │
│  │  app.post('/api/events', async (req, res) => {     │  │
│  │    const userId = req.kauth.grant.access_token     │  │
│  │                      .content.sub;                 │  │
│  │    const user = await getUserOrCreate(userId);     │  │
│  │    const event = await createEvent(...);           │  │
│  │    res.json(event);                                │  │
│  │  })                                                │  │
│  └──────────────────┬─────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ 4. Database Operations
                    ▼
┌──────────────────────────────────────────────────────────┐
│  Database Layer (server/storage.ts)                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Storage Interface (PostgreSQL via Drizzle ORM)    │  │
│  │                                                    │  │
│  │  - getUserOrCreate(keycloakId)                     │  │
│  │  - createEvent(eventData)                          │  │
│  │  - updateEvent(id, updates)                        │  │
│  │  - getEventsByUser(userId)                         │  │
│  │  - etc...                                          │  │
│  └──────────────────┬─────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ 5. SQL Query
                    ▼
┌──────────────────────────────────────────────────────────┐
│  PostgreSQL Database (postgres:5432)                     │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │   users     │  │   events    │  │ cfp_submit   │      │
│  ├─────────────┤  ├─────────────┤  ├──────────────┤      │
│  │ id          │  │ id          │  │ id           │      │
│  │ keycloak_id │  │ name        │  │ event_id     │      │
│  │ username    │  │ start_date  │  │ title        │      │
│  │ email       │  │ location    │  │ submitter_id │      │
│  │ name        │  │ priority    │  │ status       │      │
│  └─────────────┘  └─────────────┘  └──────────────┘      │
│                                                          │
│  + attendees, assets, stakeholders, approval_workflows   │
│  + sponsorships, workflow_reviewers, etc.                │
└──────────────────────────────────────────────────────────┘
```

## File Upload Flow

```
┌────────────────┐
│  React Client  │
└────────┬───────┘
         │
         │ 1. User selects file
         ▼
┌────────────────────────────────────┐
│  File Upload Component             │
│  - Validate file type              │
│  - Check file size                 │
│  - Create FormData                 │
└────────┬───────────────────────────┘
         │
         │ 2. POST /api/assets/upload
         │    with Bearer token
         ▼
┌──────────────────────────────────────────────────────────┐
│  Express Server - Upload Middleware                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  express-fileupload middleware                     │  │
│  │  - limits: { fileSize: 50MB }                      │  │
│  │  - useTempFiles: true                              │  │
│  │  - tempFileDir: '/tmp/'                            │  │
│  │  - safeFileNames: true                             │  │
│  │  - preserveExtension: true                         │  │
│  └──────────────────┬─────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ 3. File validation
                    ▼
┌──────────────────────────────────────────────────────────┐
│  Upload Route Handler (server/routes.ts)                 │
│                                                          │
│  - Validate MIME type against whitelist                  │
│  - Sanitize filename                                     │
│  - Generate unique filename with UUID                    │
│  - Check virus/malware (if configured)                   │
│  - Validate file extension                               │
└────────┬─────────────────────────────────────────────────┘
         │
         │ 4. Save file
         ▼
┌────────────────────────────────────┐
│  File Storage Options              │
│                                    │
│  Option A: Local PVC               │
│  /app/uploads/...                  │
│                                    │
│  Option B: MinIO Object Storage    │
│  s3://ospo-uploads/...             │
└────────┬───────────────────────────┘
         │
         │ 5. Create database record
         ▼
┌────────────────────────────────────┐
│  PostgreSQL - assets table         │
│  - id, name, type, file_path       │
│  - file_size, mime_type            │
│  - uploaded_by, event_id           │
│  - uploaded_at                     │
└────────────────────────────────────┘
```

## Deployment Flow (OpenShift)

```
┌────────────────┐
│  Developer     │
└────────┬───────┘
         │ 1. Run `./configure.sh`
         │ 2. Run `./deploy.sh --prod`
         ▼
┌──────────────────────────────────────────────────────────┐
│  Deploy Script (deploy.sh)                               │
│                                                          │
│  1. Load environment variables from .env                 │
│  2. Login to OpenShift (oc login)                        │
│  3. Switch to namespace (prod-rh-events-org)             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Deployment Sequence:                              │  │
│  │                                                    │  │
│  │  Step 1: Deploy PostgreSQL                         │  │
│  │  ├─ Create PVC (postgres-data)                     │  │
│  │  ├─ Create Secret (postgres credentials)           │  │
│  │  ├─ Apply deployment (postgres-deployment.yaml)    │  │
│  │  ├─ Create Service (postgres:5432)                 │  │
│  │  └─ Wait for deployment ready                      │  │
│  │                                                    │  │
│  │  Step 2: Initialize Databases                      │  │
│  │  ├─ Create ospo_events database                    │  │
│  │  ├─ Create keycloak database                       │  │
│  │  └─ Run init-db.sql                                │  │
│  │                                                    │  │
│  │  Step 3: Deploy Keycloak                           │  │
│  │  ├─ Create realm ConfigMap                         │  │
│  │  ├─ Set KC_HOSTNAME env var                        │  │
│  │  ├─ Apply deployment (keycloak-deployment.yaml)    │  │
│  │  ├─ Create Service (keycloak:8080)                 │  │
│  │  ├─ Create Route (keycloak-prod.rh-events.org)     │  │
│  │  └─ Wait for deployment ready                      │  │
│  │                                                    │  │
│  │  Step 4: Deploy MinIO (optional)                   │  │
│  │  ├─ Create PVC (minio-data)                        │  │
│  │  ├─ Apply deployment (minio-deployment.yaml)       │  │
│  │  └─ Create Service (minio:9000)                    │  │
│  │                                                    │  │
│  │  Step 5: Build & Deploy Application                │  │
│  │  ├─ Create ImageStream                             │  │
│  │  ├─ Create BuildConfig (S2I Docker)                │  │
│  │  ├─ Start build (oc start-build)                   │  │
│  │  │  ├─ Dockerfile build                            │  │
│  │  │  ├─ npm install                                 │  │
│  │  │  ├─ Vite build (client)                         │  │
│  │  │  └─ Push to ImageStream                         │  │
│  │  ├─ Create keycloak.json ConfigMap                 │  │
│  │  ├─ Apply deployment (app-deployment.yaml)         │  │
│  │  ├─ Create Service (ospo-app:4576)                 │  │
│  │  ├─ Create Route (*.rh-events.org)                 │  │
│  │  └─ Wait for deployment ready                      │  │
│  │                                                    │  │
│  │  Step 6: Create Custom Domain Routes               │  │
│  │  ├─ Request Let's Encrypt certificate              │  │
│  │  ├─ Create TLS secret                              │  │
│  │  └─ Create route with custom domain                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Data Model Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────────────┐
│ keycloak_id     │              │
│ username        │              │
│ email           │              │
│ name            │              │
└────────┬────────┘              │
         │                       │
         │ created_by_id         │ uploaded_by
         │                       │
         ▼                       │
┌─────────────────┐              │
│     events      │              │
│─────────────────│              │
│ id (PK)         │◄─────────┐   │
│ name            │          │   │
│ start_date      │          │   │
│ end_date        │          │   │
│ location        │          │   │
│ priority        │          │   │
│ status          │          │   │
│ created_by_id   │          │   │
└────────┬────────┘          │   │
         │                   │   │
         │ event_id          │   │
         │                   │   │
         ├───────────────────┼───┼────────────┐
         │                   │   │            │
         ▼                   │   │            ▼
┌─────────────────┐          │   │   ┌─────────────────┐
│ cfp_submissions │          │   │   │    attendees    │
│─────────────────│          │   │   │─────────────────│
│ id (PK)         │          │   │   │ id (PK)         │
│ event_id (FK)   │          │   │   │ event_id (FK)   │
│ title           │          │   │   │ name            │
│ submitter_id    │          │   │   │ email           │
│ status          │          │   │   │ user_id (FK)    │
└─────────────────┘          │   │   └─────────────────┘
                             │   │
         ┌───────────────────┘   │
         │                       │
         ▼                       │
┌─────────────────┐              │
│     assets      │              │
│─────────────────│              │
│ id (PK)         │              │
│ name            │              │
│ type            │              │
│ file_path       │              │
│ event_id (FK)   │              │
│ uploaded_by (FK)├──────────────┘
│ cfp_submit_id   │
└─────────────────┘

         ┌───────────────────┐
         │                   │
         ▼                   │
┌─────────────────┐          │
│  stakeholders   │          │
│─────────────────│          │
│ id (PK)         │          │
│ name            │          │
│ email           │          │
│ role            │          │
└─────────────────┘          │
                             │
         ┌───────────────────┘
         │
         ▼
┌─────────────────┐
│approval_workflw │
│─────────────────│
│ id (PK)         │
│ event_id (FK)   │
│ status          │
│ approval_type   │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│workflow_     │   │workflow_     │   │workflow_     │
│reviewers     │   │stakeholders  │   │comments      │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Security Flow

```
┌────────────────────────────────────────────────────────────┐
│  Security Layers                                           │
│                                                            │
│  1. Network Layer (OpenShift)                              │
│     ├─ TLS Termination at Route (Let's Encrypt)            │
│     ├─ Network Policies (pod-to-pod communication)         │
│     └─ Ingress Rules (external access control)             │
│                                                            │
│  2. Application Layer (Express.js)                         │
│     ├─ Helmet (Security Headers)                           │
│     │  ├─ Content Security Policy (CSP)                    │
│     │  ├─ X-Frame-Options: DENY                            │
│     │  ├─ X-Content-Type-Options: nosniff                  │
│     │  └─ HSTS (Strict-Transport-Security)                 │
│     ├─ Rate Limiting (prevent DoS)                         │
│     ├─ CORS Configuration                                  │
│     └─ Input Validation & Sanitization                     │
│                                                            │
│  3. Authentication Layer (Keycloak)                        │
│     ├─ OpenID Connect / OAuth 2.0                          │
│     ├─ JWT Token Validation                                │
│     ├─ Token Signature Verification                        │
│     ├─ Token Expiration Checks                             │
│     └─ Role-Based Access Control (RBAC)                    │
│        ├─ admin: Full access                               │
│        ├─ reviewer: Review submissions                     │
│        └─ user: Standard access                            │
│                                                            │
│  4. Authorization Layer (Application)                      │
│     ├─ Route Protection (Auth Middleware)                  │
│     ├─ Resource Ownership Validation                       │
│     └─ Permission Checks                                   │
│                                                            │
│  5. Data Layer (PostgreSQL)                                │
│     ├─ Parameterized Queries (SQL Injection prevention)    │
│     ├─ Database User Permissions                           │
│     ├─ Connection Encryption (SSL/TLS)                     │
│     └─ Backup & Recovery                                   │
│                                                            │
│  6. File Storage Security                                  │
│     ├─ File Type Validation (whitelist)                    │
│     ├─ File Size Limits (50MB)                             │
│     ├─ Filename Sanitization                               │
│     ├─ Virus Scanning (if configured)                      │
│     └─ Secure Storage Permissions                          │
└────────────────────────────────────────────────────────────┘
```

## Environment-Specific Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  Development Environment (dev-rh-events-org)                │
│                                                             │
│  URLs:                                                      │
│  - Application: https://dev.rh-events.org                   │
│  - Keycloak: https://keycloak-dev.rh-events.org             │
│                                                             │
│  Resources:                                                 │
│  - Smaller resource limits                                  │
│  - Single replica                                           │
│  - Faster deployment cycles                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Production Environment (prod-rh-events-org)                │
│                                                             │
│  URLs:                                                      │
│  - Application: https://rh-events.org                       │
│  - Keycloak: https://keycloak-prod.rh-events.org            │
│                                                             │
│  Resources:                                                 │
│  - Higher resource limits                                   │
│  - Auto-scaling (1-3 replicas)                              │
│  - Production-grade monitoring                              │
│  - Persistent data backups                                  │
└─────────────────────────────────────────────────────────────┘
```

## Key Configuration Points

### Keycloak Hostname Configuration
- **Server-side**: `KC_HOSTNAME` and `KC_HOSTNAME_ADMIN` environment variables
- **Client-side**: `VITE_KEYCLOAK_URL` build-time variable
- **Realm Config**: Redirect URIs must include custom domains
- **Routes**: OpenShift routes with TLS certificates

### Critical URLs to Configure
1. `DEV_KEYCLOAK_URL` → `https://keycloak-dev.rh-events.org`
2. `PROD_KEYCLOAK_URL` → `https://keycloak-prod.rh-events.org`
3. `VITE_KEYCLOAK_URL_DEV` → `https://keycloak-dev.rh-events.org/auth`
4. `VITE_KEYCLOAK_URL_PROD` → `https://keycloak-prod.rh-events.org/auth`

### Keycloak Realm Configuration
- Valid Redirect URIs must include:
  - `https://*.rh-events.org/*`
  - `https://dev.rh-events.org/*`
  - `https://rh-events.org/*`
- Web Origins must match redirect URIs

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend                                                   │
│  ├─ React 18 (UI Framework)                                 │
│  ├─ TypeScript (Type Safety)                                │
│  ├─ Vite (Build Tool & Dev Server)                          │
│  ├─ React Router (Client-side Routing)                      │
│  ├─ Tailwind CSS (Styling)                                  │
│  ├─ Shadcn UI (Component Library)                           │
│  └─ Keycloak JS (Authentication Client)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Backend                                                    │
│  ├─ Node.js 20 (Runtime)                                    │
│  ├─ Express.js (Web Framework)                              │
│  ├─ TypeScript (Type Safety)                                │
│  ├─ Keycloak Connect (Server-side Auth)                     │
│  ├─ express-fileupload (File Handling)                      │
│  ├─ Helmet (Security)                                       │
│  └─ express-rate-limit (DoS Protection)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Database & ORM                                             │
│  ├─ PostgreSQL 16 (Database)                                │
│  ├─ Drizzle ORM (Type-safe Database Access)                 │
│  └─ pg (PostgreSQL Driver)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Authentication & Authorization                             │
│  ├─ Keycloak 23.0.6 (IdP & SSO)                             │
│  ├─ OpenID Connect (Protocol)                               │
│  └─ OAuth 2.0 (Authorization)                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Storage                                                    │
│  ├─ MinIO (Object Storage - Optional)                       │
│  └─ PersistentVolumeClaims (Kubernetes Storage)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Deployment & Infrastructure                                │
│  ├─ OpenShift (Kubernetes Distribution)                     │
│  ├─ Docker (Containerization)                               │
│  ├─ Let's Encrypt (TLS Certificates)                        │
│  └─ cert-manager (Certificate Management)                   │
└─────────────────────────────────────────────────────────────┘
```

