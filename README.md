# OSPO Events Management Application

A comprehensive event management system for Open Source Program Offices (OSPOs), designed to streamline the process of tracking events, submissions, attendees, and related resources.

## Features

- **Event Management**: Create, update, and track OSPO events
- **CFP Submission Tracking**: Manage call for papers submissions with status updates
- **Attendee Management**: Track attendees for each event
- **Asset Management**: Store and organize files such as abstracts, trip reports, and headshots
- **Stakeholder Management**: Track stakeholders involved in events
- **Approval Workflows**: Implement approval processes for events and other items
- **User Profiles**: Maintain user information with job titles and profile pictures
- **Authentication**: Secure access with Keycloak integration and 2FA support

## Technical Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Keycloak for secure user management
- **File Storage**: Local storage with plans for MinIO integration

## Deployment Options

### Option 1: Local Development

To run the application locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### Option 2: Direct Docker Deployment

For a quick deployment using Docker:

```bash
# Run the direct deployment script
./k8s/direct-deploy.sh
```

This will:
1. Build a Docker image of the application
2. Create a Docker network
3. Start a PostgreSQL container
4. Start the application container
5. Connect the application to the database

### Option 3: Kubernetes Deployment

For production-grade Kubernetes deployment:

```bash
# Build the Docker image
./k8s/docker-build-prod.sh

# Deploy to Kubernetes
./k8s/deploy.sh
```

See `k8s/DEPLOYMENT.md` for detailed instructions on Kubernetes deployment.

## Customization

### Environment Variables

The application can be configured using the following environment variables:

- `NODE_ENV`: Set to `development` or `production`
- `PORT`: The port to run the server on (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `KEYCLOAK_URL`: URL of the Keycloak server
- `KEYCLOAK_REALM`: Keycloak realm name
- `KEYCLOAK_CLIENT_SECRET`: Client secret for Keycloak

### Database Configuration

The application uses PostgreSQL with Drizzle ORM. Database schema is defined in `shared/schema.ts`. To update the database schema:

```bash
npm run db:push
```

## Development Guidelines

- **Frontend**: Add new pages in `client/src/pages` and register them in `App.tsx`
- **Backend**: Add new API routes in `server/routes.ts`
- **Database**: Update schema definitions in `shared/schema.ts`

## Architecture

The application follows a client-server architecture:

- **Client**: React SPA with TanStack Query for data fetching
- **Server**: Express.js API server with PostgreSQL database
- **Authentication**: Keycloak integration for secure user management
- **File Storage**: Local file storage with uploads directory

## Kubernetes Architecture

When deployed to Kubernetes, the application consists of:

1. **App Server**: Node.js application in a container
2. **PostgreSQL**: Database server for persistent storage
3. **Keycloak**: Authentication server
4. **MinIO**: (Optional) Object storage for file uploads

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.