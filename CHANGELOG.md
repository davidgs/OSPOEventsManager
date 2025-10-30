# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Users page with user management functionality
- User profile editing capabilities
- Asset ownership tracking and management
- Approval workflows system
- CFP submissions management
- Attendees management
- Sponsorships management
- Stakeholders management
- CSV import functionality for events
- File upload system with security validation
- Keycloak integration for authentication
- PostgreSQL database integration
- Docker containerization
- OpenShift deployment configuration

### Changed
- Fixed invalid image reference in deployment configuration
- Updated Dockerfile to use fully qualified image names
- Enhanced Content Security Policy configuration
- Improved error handling throughout the application
- Updated authentication middleware
- Enhanced file upload security with type validation

### Fixed
- Resolved linting errors in `server/routes.ts` and `server/vite.ts`
- Fixed TypeScript type assertions and error handling
- Corrected `import.meta.dirname` usage in Node.js environment
- Fixed asset property access in frontend components
- Resolved CSP directive quoting issues
- Fixed environment variable substitution in deployment scripts
- **Asset Persistence**: Fixed asset loss on app restarts by configuring `UPLOADS_DIR` to use persistent volume
- **Asset Ownership**: Fixed "Unknown User" display by using `uploadedByName` from backend response instead of complex user lookups
- **Event Editing**: Fixed "Invalid time value" error when editing events by adding safe date parsing with proper validation
- **CFP Submissions API**: Fixed 500 error by adding missing `created_at` and `updated_at` columns to `cfp_submissions` table
- **EditEventModal**: Fixed missing imports (`cn`, `Checkbox`, and `format`) that were causing ReferenceError crashes
- **Event Creator Tracking**: Fixed missing `created_by_id` field by automatically populating it with the authenticated user's database ID when creating events
- **Creator/Edit History System**: Implemented comprehensive tracking system for who created and edited entities
  - Added `created_by_id` and `updated_by_id` fields to events and assets tables
  - Created `edit_history` table to track all entity modifications
  - Updated backend APIs to automatically populate creator/edit tracking fields
  - Added `/api/edit-history/:entityType/:entityId` endpoint for fetching edit history
  - Created `CreatorInfo` and `EditHistory` React components for displaying creator/editor information
  - **CRITICAL FIX**: Updated database initialization scripts (`init-db.ts` and `init-db.sql`) to include new columns, ensuring schema persistence across PostgreSQL redeployments
- **Event Editing**: Fixed EditEventModal issues
  - Made event goals optional (removed required validation)
  - Fixed field name mismatch between frontend and backend (`startDate` → `start_date`, `endDate` → `end_date`, `cfpDeadline` → `cfp_deadline`, `goals` → `goal`)
  - Fixed "Update Event" button functionality
  - Removed red asterisk (*) from Event Goals field to indicate it's optional
- **Authentication**: Fixed 401 error handling
  - Added automatic redirect to login page when authentication tokens expire
  - App now properly handles expired tokens by clearing auth state and redirecting to login
- **Event Mutations**: Fixed success handling for event operations
  - Fixed add/edit/delete event mutations to properly handle API responses
  - EditEventModal now closes automatically on successful update
  - Added proper error handling and success feedback for all event operations

### Security
- Implemented comprehensive file upload validation
- Added rate limiting middleware
- Enhanced input sanitization
- Improved authentication and authorization
- Added secure filename generation
- Implemented directory traversal protection

## [1.0.0] - 2024-01-XX

### Added
- Initial release of OSPO Events Manager
- Basic event management functionality
- User authentication system
- Database schema and migrations
- API endpoints for core functionality
- React frontend with TypeScript
- Express.js backend with security middleware
- Docker and Kubernetes deployment configurations

---

## Development Notes

### Recent Fixes (Current Session)
- **Linting Errors**: Fixed all TypeScript linting errors in server files
  - Proper error handling with type guards
  - Fixed CSV column mapping type assertions
  - Resolved Vite import issues with TypeScript ignore comments
  - Fixed Node.js compatibility issues with `__dirname` vs `import.meta.dirname`

- **Asset Management**: Fixed property access issues in frontend
  - Corrected `uploaded_by_name` to `uploadedByName` property access
  - Added proper type assertions for server-enhanced objects

- **Deployment Issues**: Resolved various deployment problems
  - Fixed invalid image reference with double slashes
  - Added Docker Hub pull secrets for base image authentication
  - Fixed environment variable export issues in deployment scripts

### Known Issues
- Users page currently shows only 1 user (David Simmons) - may need additional user seeding
- Some Keycloak integration features may need further testing
- File upload size limits and type restrictions may need adjustment based on usage

### Next Steps
- Add more comprehensive user management features
- Implement bulk operations for events and assets
- Add advanced search and filtering capabilities
- Enhance reporting and analytics features
- Improve mobile responsiveness
- Add automated testing suite
- **MinIO Integration**: Replace local file storage with MinIO object storage for better scalability and reliability
  - Implement MinIO client integration in backend
  - Update file upload/serving logic to use MinIO endpoints
  - Migrate existing assets from persistent volume to MinIO
  - Remove unused MinIO deployment or fully utilize it
