# Events Management System

## Overview

The Events Management System is a comprehensive event management application designed for Open Source Program Offices (OSPOs). It provides tools for managing events, call-for-papers submissions, attendees, assets, and approval workflows. The system features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Keycloak for authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn UI components built on Radix UI primitives
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Authentication**: Keycloak integration for enterprise-grade auth
- **File Upload**: Express-fileupload middleware for asset management
- **Session Management**: PostgreSQL-backed sessions with fallback to memory store

### Database Architecture
- **Primary Database**: PostgreSQL for structured data
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Strategy**: SQL-based migrations with TypeScript schema definitions
- **Connection**: Node-postgres driver with connection pooling

## Key Components

### Core Domain Models
- **Events**: Central entity for tracking events with status, dates, and metadata
- **Users**: Application users with Keycloak integration for authentication
- **CFP Submissions**: Call-for-papers tracking with approval workflows
- **Attendees**: Event participant management
- **Assets**: File storage system for documents, abstracts, and media
- **Approval Workflows**: Configurable approval processes for events and submissions

### Authentication System
- **Provider**: Keycloak for centralized identity management
- **Integration**: Express middleware for session handling
- **Security**: 2FA support, session management, and role-based access
- **User Mapping**: Automatic user creation/synchronization between Keycloak and application database

### File Management
- **Storage**: Local filesystem with configurable upload directory
- **Processing**: Express-fileupload middleware with size limits and validation
- **Future**: MinIO integration planned for cloud-native deployments

### API Layer
- **Architecture**: RESTful API with Express.js routes
- **Validation**: Zod schema validation for request/response data
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Health Checks**: Kubernetes-ready health endpoints

## Data Flow

### User Authentication Flow
1. User accesses application
2. Keycloak authentication middleware intercepts requests
3. User redirected to Keycloak login if not authenticated
4. Upon successful auth, user record created/updated in application database
5. Session established with PostgreSQL-backed session store

### Event Management Flow
1. Authenticated user creates/updates events through React frontend
2. Form data validated with Zod schemas
3. API requests sent to Express backend with authentication headers
4. Backend validates user permissions and data integrity
5. Drizzle ORM performs database operations
6. Response sent back to frontend with updated data

### File Upload Flow
1. User selects files through frontend upload interface
2. Files sent to backend via multipart form data
3. Express-fileupload middleware processes and validates files
4. Files stored in local uploads directory
5. Metadata stored in database with file references
6. Frontend updated with upload confirmation

## External Dependencies

### Required Services
- **PostgreSQL**: Primary database for all application data
- **Keycloak**: Authentication and user management service
- **Node.js Runtime**: JavaScript execution environment

### Optional Services
- **MinIO**: Object storage for scalable file management (planned)
- **Redis**: Session store alternative for high-availability setups (configurable)

### Development Dependencies
- **Vite**: Frontend build tool and development server
- **TSX**: TypeScript execution for development
- **Drizzle Kit**: Database schema management and migrations

## Deployment Strategy

### Container-Based Deployment
- **Application**: Dockerized Node.js application with multi-stage builds
- **Dependencies**: Separate containers for PostgreSQL and Keycloak
- **Orchestration**: Docker Compose for local development, Kubernetes for production

### Replit Deployment
- **Database**: Neon PostgreSQL integration for managed database
- **Runtime**: Native Node.js execution with tsx for TypeScript
- **Static Assets**: Vite-built assets served directly by Express

### Kubernetes Deployment
- **Application Pod**: Containerized application with health checks
- **Database**: PostgreSQL deployment with persistent volumes
- **Authentication**: Keycloak service with realm configuration
- **Load Balancing**: Service-based routing with ingress controllers
- **Storage**: ConfigMaps for configuration, Secrets for sensitive data

### Environment Configuration
- **Development**: Local services with hot reloading via Vite
- **Production**: Optimized builds with static asset serving
- **Docker**: Multi-service setup with service discovery
- **Kubernetes**: Declarative configuration with resource management

## Changelog
```
Changelog:
- June 26, 2025. Initial setup
```
