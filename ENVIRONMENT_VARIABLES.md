# Events Manager - Environment Variables

This document lists all environment variables used by the Events Manager application.

## 🚀 Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment (`development`, `production`) |
| `PORT` | `4576` | Port number for the server |

## 🔒 Security & Sessions

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | `your-secret-key-change-in-production` | Secret key for session encryption (⚠️ MUST change in production) |
| `SESSION_RESAVE` | `false` | Force session save even if not modified (`true`/`false`) |
| `SESSION_SAVE_UNINITIALIZED` | `false` | Save uninitialized sessions (`true`/`false`) |
| `SESSION_SECURE` | `true` (prod), `false` (dev) | HTTPS-only cookies (`true`/`false`) |
| `SESSION_HTTP_ONLY` | `true` | Prevent client-side cookie access (`true`/`false`) |
| `SESSION_MAX_AGE` | `86400000` | Session lifetime in milliseconds (default: 24 hours) |
| `SESSION_SAME_SITE` | `lax` | Cookie SameSite policy (`strict`, `lax`, `none`) |
| `SESSION_NAME` | `ospo.sid` | Session cookie name |
| `JWT_SECRET` | - | JWT signing secret (⚠️ Required for production) |

## 🛡️ Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in milliseconds (default: 15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per window per IP |
| `RATE_LIMIT_MESSAGE` | `Too many requests...` | Rate limit exceeded error message |
| `RATE_LIMIT_RETRY_AFTER` | `900` | Retry after seconds when rate limited |
| `RATE_LIMIT_STANDARD_HEADERS` | `true` | Include standard rate limit headers (`true`/`false`) |
| `RATE_LIMIT_LEGACY_HEADERS` | `false` | Include legacy rate limit headers (`true`/`false`) |
| `RATE_LIMIT_SKIP_PATHS` | `/api/health,/api/version` | Comma-separated paths to skip rate limiting |

## 🛡️ Security Headers (Helmet/CSP)

| Variable | Default | Description |
|----------|---------|-------------|
| `KEYCLOAK_CLIENT_URL` | - | Keycloak URL for CSP (alternative to VITE_KEYCLOAK_URL) |
| `CSP_STYLE_SRC` | `https://fonts.googleapis.com` | Additional style sources (comma-separated) |
| `CSP_SCRIPT_SRC` | - | Additional script sources (comma-separated) |
| `CSP_IMG_SRC` | - | Additional image sources (comma-separated) |
| `CSP_CONNECT_SRC` | - | Additional connect sources (comma-separated) |
| `CSP_FONT_SRC` | `https://fonts.gstatic.com` | Additional font sources (comma-separated) |
| `CSP_OBJECT_SRC` | `'none'` | Object sources policy |
| `CSP_MEDIA_SRC` | - | Additional media sources (comma-separated) |
| `CSP_FRAME_SRC` | - | Additional frame sources (comma-separated) |
| `HELMET_COEP` | `false` | Enable Cross-Origin Embedder Policy (`true`/`false`) |
| `HELMET_HSTS_MAX_AGE` | `31536000` | HSTS max age in seconds (default: 1 year) |
| `HELMET_HSTS_INCLUDE_SUBDOMAINS` | `true` | Include subdomains in HSTS (`true`/`false`) |
| `HELMET_HSTS_PRELOAD` | `true` | Enable HSTS preload (`true`/`false`) |

## 🗄️ Database (PostgreSQL)

| Variable | Default | Description |
|----------|---------|-------------|
| `PGHOST` | `postgres` (prod), `localhost` (dev) | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGDATABASE` | `ospo_events` | Database name |
| `PGUSER` | `ospo_user` | Database username |
| `PGPASSWORD` | `postgres_password` | Database password (⚠️ Change in production) |
| `DATABASE_URL` | - | Complete database connection string (alternative to individual vars) |

## 🔐 Keycloak Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `KEYCLOAK_URL` | - | Keycloak server URL (for backend communication) |
| `KEYCLOAK_SERVER_URL` | `https://keycloak-dev-...` | Keycloak admin API URL |
| `KEYCLOAK_REALM` | `ospo-events` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | `ospo-events-app` | Keycloak client ID |
| `KEYCLOAK_SERVICE_NAME` | `keycloak` | Kubernetes service name for Keycloak |
| `KEYCLOAK_SERVICE_PORT` | `8080` | Keycloak service port |
| `KEYCLOAK_ADMIN` | `admin` | Keycloak admin username |
| `KEYCLOAK_ADMIN_PASSWORD` | `admin` | Keycloak admin password (⚠️ Change in production) |

## 🔄 Proxy Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PROXY_FORWARDED_HOST` | `localhost:{PORT}` | Host header for proxied requests |
| `PROXY_FORWARDED_PROTO` | `http` | Protocol header for proxied requests |
| `PROXY_FORWARDED_PORT` | `{PORT}` | Port header for proxied requests |
| `PROXY_REDIRECT_PATTERN` | `localhost/auth` | Pattern to match in redirect URLs |
| `PROXY_REDIRECT_REPLACEMENT` | `localhost:{PORT}/auth` | Replacement for redirect URLs |
| `PROXY_TIMEOUT_MS` | `10000` | Proxy request timeout in milliseconds |

## 📦 File Storage (MinIO)

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | - | MinIO server endpoint |
| `MINIO_ACCESS_KEY` | - | MinIO access key |
| `MINIO_SECRET_KEY` | - | MinIO secret key |
| `MINIO_BUCKET` | - | MinIO bucket name for uploads |
| `UPLOADS_DIR` | `public/uploads` | Local uploads directory (fallback) |

## 🌐 Frontend Build Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_KEYCLOAK_URL` | - | Keycloak URL for frontend (build-time variable) |

## ⚠️ Security Notes

**Critical for Production:**
- `SESSION_SECRET` - Must be a strong, unique secret
- `JWT_SECRET` - Must be a strong, unique secret
- `PGPASSWORD` - Must be a secure database password
- `KEYCLOAK_ADMIN_PASSWORD` - Must be a secure admin password
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` - Must be secure storage credentials

## 📋 Environment-Specific Recommendations

### Development
```env
NODE_ENV=development
SESSION_SAME_SITE=lax
SESSION_SECURE=false
RATE_LIMIT_MAX=1000
```

### Production
```env
NODE_ENV=production
SESSION_SAME_SITE=lax
SESSION_SECURE=true
RATE_LIMIT_MAX=100
# + all required secrets
```

## 🔧 Configuration Priority

1. Environment variables (highest priority)
2. Default values (fallback)

All defaults are designed to work in development but **must be configured** for production use.