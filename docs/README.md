# OSPO Events Manager Documentation

Welcome to the comprehensive documentation for OSPO Events Manager!

## Accessing the Documentation

### Within the Application
Click the **Docs** button in the application header to access the documentation in a new window or tab.

### Local Development
Documentation is served at `/docs` when the application is running.

## Documentation Structure

```
docs/
├── index.md                    # Main documentation index
├── README.md                   # This file
│
├── user/                       # User documentation
│   ├── getting-started.md      # How to get started
│   ├── managing-events.md      # Event management guide
│   ├── cfp-submissions.md      # CFP submission guide
│   ├── file-uploads.md         # File upload guide
│   ├── user-profile.md         # Profile management
│   ├── approval-workflows.md   # Workflow guide
│   └── faq.md                  # Frequently asked questions
│
├── admin/                      # Administrator documentation
│   ├── user-management.md      # Managing users
│   ├── event-review.md         # Reviewing events
│   ├── system-settings.md      # System configuration
│   └── backup-restore.md       # Data backup/restore
│
├── developer/                  # Developer documentation
│   ├── architecture.md         # System architecture
│   ├── setup.md                # Development setup
│   ├── api.md                  # API documentation
│   ├── database.md             # Database schema
│   ├── deployment.md           # Deployment guide
│   ├── configuration.md        # Configuration guide
│   ├── contributing.md         # Contributing guidelines
│   └── security.md             # Security practices
│
└── general/                    # General documentation
    ├── requirements.md         # System requirements
    ├── changelog.md            # Version history
    ├── troubleshooting.md      # Common issues
    └── support.md              # Getting help
```

## Documentation Format

All documentation is written in **Markdown** format (`.md` files), which provides:
- Easy readability in plain text
- Rich formatting when rendered
- Version control friendly
- Easy to edit and maintain

## Contributing to Documentation

To improve or add to the documentation:

1. Edit the relevant `.md` file in the `docs/` directory
2. Follow Markdown best practices
3. Test your changes locally
4. Submit a pull request (if applicable)

### Documentation Guidelines

- **Clear headings**: Use hierarchical headings (H1, H2, H3)
- **Code examples**: Use code blocks with syntax highlighting
- **Links**: Use relative links for internal docs, full URLs for external
- **Images**: Store in `docs/images/` and use relative paths
- **Consistency**: Follow the style of existing documentation

## Building/Serving Documentation

The documentation is automatically served by the Express.js backend at `/api/docs/*`. No special build process is required.

### API Endpoint

```
GET /api/docs/{path-to-markdown-file}
```

Examples:
- `/api/docs/index.md` - Main index
- `/api/docs/user/getting-started.md` - User guide
- `/api/docs/developer/architecture.md` - Developer docs

### Frontend Component

The React component at `client/src/pages/docs-page.tsx` handles:
- Fetching markdown files from the API
- Rendering markdown to HTML
- Navigation between docs
- Responsive mobile layout

## Search and Navigation

- Use the sidebar to browse documentation sections
- Click on any section to expand subsections
- Active page is highlighted in the sidebar
- Mobile users can access navigation via the menu button

## Quick Links

- [Start Here](index.md) - Main documentation index
- [User Guide](user/getting-started.md) - For end users
- [Admin Guide](admin/user-management.md) - For administrators
- [Developer Guide](developer/architecture.md) - For developers

## Need Help?

If you can't find what you're looking for:

1. Check the [FAQ](user/faq.md)
2. Review the [Troubleshooting Guide](general/troubleshooting.md)
3. Contact your system administrator
4. Submit feedback using the Feedback button in the app

---

**Documentation Version**: 1.0.0
**Last Updated**: 2025-10-30
**Maintained by**: OSPO Events Manager Team

