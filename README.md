# Events Management Application

[![CI Pipeline](https://github.com/davidgs/OSPOEventsManager/actions/workflows/ci.yml/badge.svg)](https://github.com/davidgs/OSPOEventsManager/actions/workflows/ci.yml)
[![Tests](https://github.com/davidgs/OSPOEventsManager/actions/workflows/test.yml/badge.svg)](https://github.com/davidgs/OSPOEventsManager/actions/workflows/test.yml)
[![Test Coverage](https://img.shields.io/badge/tests-899%20passed-brightgreen)](./TEST_SUITE_SUMMARY.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A comprehensive event management system for Open Source Program Offices (OSPOs), designed to streamline the process of tracking events, submissions, attendees, and related resources.

## Features

- **Event Management**: Create, update, and track events with comprehensive metadata
- **CFP Submission Tracking**: Manage call for papers submissions with status updates and file attachments
- **Attendee Management**: Track attendees for each event with contact information
- **Asset Management**: Store and organize files such as abstracts, trip reports, headshots, and documents
- **Stakeholder Management**: Track stakeholders involved in events and their roles
- **Approval Workflows**: Implement approval processes for events and other items with reviewer assignments
- **User Profiles**: Maintain user information with job titles, bio, and profile pictures
- **User Management**: View and manage all registered users with role-based access
- **CSV Import**: Bulk import events from CSV files with intelligent deduplication
- **Authentication**: Secure access with Keycloak integration and role-based permissions
- **File Upload Security**: Comprehensive file validation, sanitization, and secure storage
- **Internationalization (i18n)**: Comprehensive multi-language support with:
  - Language selection UI in Header and Settings
  - Persistent language preferences (database + localStorage)
  - Locale-aware date, number, and currency formatting
  - Translation support across all components (forms, modals, pages, UI)
  - Organized translation files by namespace
  - Initial support for English (en), infrastructure ready for additional languages

## Technical Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Node.js with Express.js and comprehensive security middleware
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Keycloak for secure user management and role-based access control
- **File Storage**: Local storage with secure upload handling and validation
- **Deployment**: Docker containerization with OpenShift/Kubernetes support
- **Development**: Vite for fast development builds and hot module replacement

## Quick Start

### Prerequisites

- For local development: Node.js 20+, kubectl, KIND, Podman (see [kind/README.md](kind/README.md))
- For production: OpenShift CLI (oc), cluster access, Docker

### Local Development Setup

```bash
# Clone and install
git clone <repository-url>
cd OSPOEventsManager
npm install

# Configure and deploy services to KIND cluster
./configure.sh --local
./deploy.sh --local
npm run db:push:local

# Run application locally (NOT in cluster - enables hot reload)
npm run dev:local
```

Application runs at `http://localhost:4576` with services at localhost:5432 (PostgreSQL), localhost:8080 (Keycloak), localhost:9000/9001 (MinIO).

See [kind/README.md](kind/README.md) for detailed setup and troubleshooting.

### Production Deployment Setup

```bash
# Clone and install
git clone <repository-url>
cd OSPOEventsManager
npm install

# Configure environment
./configure.sh
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

## Deployment

### Local (KIND)

```bash
./deploy.sh --local                    # Deploy all services
./deploy.sh --local --postgres         # Deploy specific service
./deploy.sh --local --keycloak --minio # Deploy multiple services
./deploy.sh --delete-local             # Delete cluster and all data
```

This deployment includes:
- PostgreSQL database with persistent storage
- Keycloak authentication server
- MinIO object storage
- Application server with auto-scaling
- Secure networking and ingress

### Production (OpenShift)

```bash
./deploy.sh --dev                      # Deploy to development
./deploy.sh --prod                     # Deploy to production
./deploy.sh --dev --app --postgres     # Deploy specific components
```

### Google Kubernetes Engine (GKE)

```bash
# Prerequisites:
# - gcloud CLI installed and authenticated
# - GKE cluster created
# - .env file configured with GKE settings

./deploy.sh --gke                      # Deploy all components
./deploy.sh --gke --app --postgres     # Deploy specific components
```

### Amazon Elastic Kubernetes Service (EKS)

```bash
# Prerequisites:
# - AWS CLI installed and configured
# - EKS cluster created
# - ECR repository created (or use Docker Hub)
# - .env file configured with EKS settings

./deploy.sh --eks                      # Deploy all components
./deploy.sh --eks --app --postgres     # Deploy specific components
```

## Configuration

```bash
./configure.sh --local  # Local development (creates .env.local)
./configure.sh          # Production (interactive setup for .env)
```

The application uses the `configure.sh` script to set up environment variables. This script will:

1. Copy `env.template` to `.env`
2. Prompt you for configuration values
3. Set up the proper environment for your deployment

Key configuration areas:
- Database connection settings
- Keycloak authentication configuration
- Security settings
- Deployment-specific variables
- File upload configuration

### Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables include:

- `events`: Event information and metadata
- `users`: User profiles and authentication data
- `assets`: File uploads and attachments
- `cfp_submissions`: Call for papers submissions
- `attendees`: Event attendees
- `sponsorships`: Event sponsorships
- `stakeholders`: Event stakeholders
- `approval_workflows`: Approval process management

To update the database schema:

```bash
# For local development
npm run db:push:local

# For production/OpenShift
npm run db:push
```

## API Endpoints

### Core Endpoints

- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/import-csv` - Bulk import events from CSV

### User Management

- `GET /api/users` - List all users (authenticated)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/profile` - Update user profile
- `POST /api/users/:id/headshot` - Upload user headshot

### Asset Management

- `GET /api/assets` - List assets with filtering
- `POST /api/assets` - Upload new asset
- `PUT /api/assets/:id` - Update asset metadata
- `DELETE /api/assets/:id` - Delete asset

### Authentication

- `GET /api/keycloak-config` - Get Keycloak configuration
- `GET /api/health` - Health check endpoint

## Security Features

- **Authentication**: Keycloak integration with JWT tokens
- **Authorization**: Role-based access control (Admin, Community Manager, User)
- **File Upload Security**:
  - File type validation
  - Size limits (10MB default)
  - Secure filename generation
  - Directory traversal protection
- **Input Validation**: Comprehensive input sanitization and validation
- **Rate Limiting**: Request rate limiting to prevent abuse
- **CSP Headers**: Content Security Policy for XSS protection

## Development Guidelines

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utilities and configuration
├── server/                 # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── services/          # Business logic services
│   └── storage.ts        # Database operations
├── shared/                # Shared types and schemas
├── k8s/                   # Kubernetes/OpenShift manifests
└── dist/                  # Built application
```

### Adding New Features

1. **Frontend**: Add pages in `client/src/pages` and register in `App.tsx`
2. **Backend**: Add API routes in `server/routes.ts`
3. **Database**: Update schema in `shared/database-schema.ts`
4. **Types**: Add TypeScript types in `shared/database-types.ts`

### Code Quality

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Comprehensive error handling
- Input validation and sanitization
- Security-first approach

## Monitoring and Maintenance

### Health Checks

- Application health endpoint: `/api/health`
- Database connectivity monitoring
- File system access validation

### Logging

- Structured logging throughout the application
- Error tracking and debugging information
- Request/response logging for API endpoints

### Backup

- Database backup scripts available
- File upload backup procedures
- Configuration backup recommendations

## Troubleshooting

### Common Issues

1. **Authentication Issues**: Check Keycloak configuration and token validity
2. **File Upload Failures**: Verify file size limits and type restrictions
3. **Database Connection**: Ensure PostgreSQL is running and accessible in OpenShift
4. **Deployment Issues**: Check OpenShift resource limits, networking, and image registry access
5. **Environment Configuration**: Use `./configure.sh` to properly set up environment variables

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper tests
4. Submit a pull request

### Local Development Workflow

```bash
# One-time setup (services in KIND cluster)
npm install
./configure.sh --local
./deploy.sh --local
npm run db:push:local

# Daily development (app runs locally for hot reload)
npm run dev:local  # Starts app at http://localhost:4576 with hot reload
npm run lint       # Code quality checks
npm run type-check # TypeScript validation
npm test          # Run test suite
```

**Key Point:** Application runs on your machine (not in cluster) for instant hot reload. Services run in KIND cluster and are accessible via localhost ports.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed information about changes and updates.