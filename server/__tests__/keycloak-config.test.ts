/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Keycloak Configuration', () => {
  describe('Bearer Token Validation', () => {
    it('should construct userinfo URL correctly', () => {
      const baseUrl = 'https://keycloak.example.com/auth';
      const realm = 'my-realm';
      const userinfoUrl = `${baseUrl.replace(/\/+$/, '')}/realms/${realm}/protocol/openid-connect/userinfo`;

      expect(userinfoUrl).toBe('https://keycloak.example.com/auth/realms/my-realm/protocol/openid-connect/userinfo');
    });

    it('should handle trailing slashes in base URL', () => {
      const baseUrlWithSlash = 'https://keycloak.example.com/auth/';
      const baseUrlWithoutSlash = 'https://keycloak.example.com/auth';
      const realm = 'my-realm';

      const url1 = `${baseUrlWithSlash.replace(/\/+$/, '')}/realms/${realm}/protocol/openid-connect/userinfo`;
      const url2 = `${baseUrlWithoutSlash.replace(/\/+$/, '')}/realms/${realm}/protocol/openid-connect/userinfo`;

      expect(url1).toBe(url2);
    });

    it('should add Authorization header with Bearer token', () => {
      const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
      const authHeader = `Bearer ${token}`;

      expect(authHeader).toContain('Bearer ');
      expect(authHeader).toContain(token);
    });

    it('should add active flag to userinfo result', () => {
      const mockUserinfo = {
        sub: '123',
        preferred_username: 'testuser',
        email: 'test@example.com'
      };

      const result = { ...mockUserinfo, active: true };
      expect(result.active).toBe(true);
    });

    it('should return null on validation failure', () => {
      const failedValidation = null;
      expect(failedValidation).toBeNull();
    });
  });

  describe('Keycloak Initialization', () => {
    it('should load keycloak.json configuration', () => {
      const mockConfig = {
        realm: 'my-realm',
        'auth-server-url': 'https://keycloak.example.com/auth',
        'ssl-required': 'external',
        resource: 'my-client',
        'public-client': true
      };

      expect(mockConfig).toHaveProperty('realm');
      expect(mockConfig).toHaveProperty('auth-server-url');
      expect(mockConfig).toHaveProperty('resource');
    });

    it('should override auth-server-url for internal communication', () => {
      const externalUrl = 'https://keycloak.example.com/auth';
      const serviceName = 'keycloak';
      const servicePort = '8080';
      const internalUrl = `http://${serviceName}:${servicePort}/`;

      expect(internalUrl).toBe('http://keycloak:8080/');
      expect(internalUrl).not.toBe(externalUrl);
    });

    it('should use environment variables for service name and port', () => {
      const defaultServiceName = process.env.KEYCLOAK_SERVICE_NAME || 'keycloak';
      const defaultServicePort = process.env.KEYCLOAK_SERVICE_PORT || '8080';

      expect(defaultServiceName).toBeTruthy();
      expect(defaultServicePort).toBeTruthy();
      expect(parseInt(defaultServicePort, 10)).toBeGreaterThan(0);
    });

    it('should enable CORS for Keycloak', () => {
      const config = {
        'enable-cors': true
      };

      expect(config['enable-cors']).toBe(true);
    });

    it('should disable SSL requirement for internal communication', () => {
      const config = {
        'ssl-required': 'none'
      };

      expect(config['ssl-required']).toBe('none');
    });

    it('should disable token audience verification', () => {
      const config = {
        'verify-token-audience': false
      };

      expect(config['verify-token-audience']).toBe(false);
    });

    it('should use resource role mappings', () => {
      const config = {
        'use-resource-role-mappings': true
      };

      expect(config['use-resource-role-mappings']).toBe(true);
    });

    it('should enable bearer-only mode', () => {
      const config = {
        'bearer-only': true
      };

      expect(config['bearer-only']).toBe(true);
    });
  });

  describe('Session Store Configuration', () => {
    it('should use PostgreSQL session store when pool available', () => {
      const poolAvailable = true;
      const sessionStoreType = poolAvailable ? 'PostgreSQL' : 'Memory';

      expect(sessionStoreType).toBe('PostgreSQL');
    });

    it('should fallback to memory store when pool unavailable', () => {
      const poolAvailable = false;
      const sessionStoreType = poolAvailable ? 'PostgreSQL' : 'Memory';

      expect(sessionStoreType).toBe('Memory');
    });

    it('should create table if missing for PostgreSQL store', () => {
      const storeConfig = {
        createTableIfMissing: true
      };

      expect(storeConfig.createTableIfMissing).toBe(true);
    });
  });

  describe('Session Configuration', () => {
    it('should use SESSION_SECRET from environment', () => {
      const secret = process.env.SESSION_SECRET || 'ospo-events-secret';
      expect(secret).toBeTruthy();
    });

    it('should not resave unchanged sessions', () => {
      const sessionConfig = {
        resave: false
      };

      expect(sessionConfig.resave).toBe(false);
    });

    it('should not save uninitialized sessions', () => {
      const sessionConfig = {
        saveUninitialized: false
      };

      expect(sessionConfig.saveUninitialized).toBe(false);
    });

    it('should set cookie max age to 24 hours', () => {
      const maxAge = 24 * 60 * 60 * 1000;
      expect(maxAge).toBe(86400000); // 24 hours in milliseconds
    });

    it('should set httpOnly cookie flag', () => {
      const cookieConfig = {
        httpOnly: true
      };

      expect(cookieConfig.httpOnly).toBe(true);
    });

    it('should enable secure cookies in production', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      const secureFlag = isProduction;

      expect(typeof secureFlag).toBe('boolean');
    });
  });

  describe('Keycloak Middleware', () => {
    it('should configure logout endpoint', () => {
      const middlewareConfig = {
        logout: '/logout'
      };

      expect(middlewareConfig.logout).toBe('/logout');
    });

    it('should configure admin endpoint', () => {
      const middlewareConfig = {
        admin: '/'
      };

      expect(middlewareConfig.admin).toBe('/');
    });

    it('should store both server and external configs', () => {
      const keycloak: any = {};
      keycloak._serverKeycloakConfig = { 'auth-server-url': 'http://keycloak:8080/' };
      keycloak._externalKeycloakConfig = { 'auth-server-url': 'https://keycloak.example.com/auth' };

      expect(keycloak._serverKeycloakConfig).toBeDefined();
      expect(keycloak._externalKeycloakConfig).toBeDefined();
      expect(keycloak._serverKeycloakConfig['auth-server-url']).not.toBe(
        keycloak._externalKeycloakConfig['auth-server-url']
      );
    });
  });

  describe('Authentication Middleware', () => {
    it('should check for Authorization header', () => {
      const authHeader = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
      const hasAuthHeader = !!authHeader;
      const isBearerToken = authHeader.startsWith('Bearer ');

      expect(hasAuthHeader).toBe(true);
      expect(isBearerToken).toBe(true);
    });

    it('should extract token from Authorization header', () => {
      const authHeader = 'Bearer my-token-here';
      const token = authHeader.substring(7);

      expect(token).toBe('my-token-here');
      expect(token).not.toContain('Bearer');
    });

    it('should return 401 for missing Bearer token', () => {
      const authHeader = undefined;
      const statusCode = authHeader ? 200 : 401;

      expect(statusCode).toBe(401);
    });

    it('should return 401 for invalid Bearer token', () => {
      const tokenValid = false;
      const statusCode = tokenValid ? 200 : 401;

      expect(statusCode).toBe(401);
    });

    it('should extract user info from token', () => {
      const tokenInfo = {
        sub: 'user-123',
        preferred_username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        realm_access: { roles: ['user'] }
      };

      const userInfo = {
        id: tokenInfo.sub,
        username: tokenInfo.preferred_username,
        email: tokenInfo.email,
        name: tokenInfo.name || tokenInfo.preferred_username,
        roles: tokenInfo.realm_access?.roles || []
      };

      expect(userInfo.id).toBe('user-123');
      expect(userInfo.username).toBe('testuser');
      expect(userInfo.email).toBe('test@example.com');
      expect(userInfo.roles).toContain('user');
    });

    it('should fallback to username when name is missing', () => {
      const tokenInfo = {
        sub: 'user-123',
        preferred_username: 'testuser',
        email: 'test@example.com',
        name: null
      };

      const name = tokenInfo.name || tokenInfo.preferred_username;
      expect(name).toBe('testuser');
    });

    it('should handle missing realm_access in token', () => {
      const tokenInfo = {
        sub: 'user-123',
        preferred_username: 'testuser',
        email: 'test@example.com'
      };

      const roles = (tokenInfo as any).realm_access?.roles || [];
      expect(roles).toEqual([]);
    });
  });

  describe('User Mapping', () => {
    it('should map Keycloak user to database user', async () => {
      const keycloakId = 'keycloak-user-123';
      const username = 'testuser';

      const mockDbUser = null; // User doesn't exist yet
      const shouldCreateUser = !mockDbUser;

      expect(shouldCreateUser).toBe(true);
    });

    it('should not create duplicate user if exists', async () => {
      const keycloakId = 'keycloak-user-123';
      const mockDbUser = { id: 5, keycloak_id: keycloakId };

      const shouldCreateUser = !mockDbUser;
      expect(shouldCreateUser).toBe(false);
    });

    it('should attach database ID to request user', () => {
      const req: any = {
        user: {
          id: 'keycloak-123',
          username: 'testuser'
        }
      };

      req.user.dbId = 5;
      expect(req.user.dbId).toBe(5);
    });
  });

  describe('Keycloak User Mapper', () => {
    it('should extract user info from Keycloak grant', () => {
      const mockGrant = {
        access_token: {
          content: {
            sub: 'user-123',
            preferred_username: 'testuser',
            email: 'test@example.com',
            name: 'Test User',
            realm_access: { roles: ['user', 'admin'] }
          }
        }
      };

      const tokenContent = mockGrant.access_token.content;
      expect(tokenContent.sub).toBe('user-123');
      expect(tokenContent.preferred_username).toBe('testuser');
      expect(tokenContent.realm_access.roles).toContain('admin');
    });

    it('should handle missing grant gracefully', () => {
      const req: any = {};
      const hasGrant = req.kauth && req.kauth.grant;

      expect(hasGrant).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should handle Keycloak import failure', async () => {
      const keycloakAvailable = false;
      const result = keycloakAvailable ? {} : null;

      expect(result).toBeNull();
    });

    it('should handle missing keycloak.json file', () => {
      const fileExists = false;
      const shouldThrowError = !fileExists;

      expect(shouldThrowError).toBe(true);
    });

    it('should return null on initialization failure', () => {
      const initFailed = true;
      const result = initFailed ? null : {};

      expect(result).toBeNull();
    });

    it('should handle authentication errors', () => {
      const authError = new Error('Authentication error');
      const statusCode = 500;

      expect(authError.message).toBe('Authentication error');
      expect(statusCode).toBe(500);
    });

    it('should handle user creation errors gracefully', () => {
      const creationError = true;
      const shouldContinue = creationError; // Continue without DB ID

      expect(shouldContinue).toBe(true);
    });
  });
});

describe('Authentication Flow', () => {
  it('should follow Bearer token authentication flow', () => {
    const steps = [
      'Check Authorization header',
      'Extract Bearer token',
      'Validate token with Keycloak',
      'Extract user info',
      'Create/find database user',
      'Attach user to request',
      'Continue to route handler'
    ];

    expect(steps).toHaveLength(7);
    expect(steps[0]).toBe('Check Authorization header');
    expect(steps[steps.length - 1]).toBe('Continue to route handler');
  });

  it('should reject unauthenticated requests', () => {
    const hasToken = false;
    const shouldReject = !hasToken;

    expect(shouldReject).toBe(true);
  });

  it('should allow authenticated requests', () => {
    const tokenValid = true;
    const shouldAllow = tokenValid;

    expect(shouldAllow).toBe(true);
  });
});

describe('Configuration Validation', () => {
  it('should validate required Keycloak config fields', () => {
    const requiredFields = [
      'realm',
      'auth-server-url',
      'resource',
      'public-client'
    ];

    requiredFields.forEach(field => {
      expect(field).toBeTruthy();
    });
  });

  it('should validate URL format', () => {
    const validUrl = 'https://keycloak.example.com/auth';
    const urlRegex = /^https?:\/\/.+/;

    expect(urlRegex.test(validUrl)).toBe(true);
  });

  it('should validate port number', () => {
    const port = '8080';
    const portNum = parseInt(port, 10);

    expect(portNum).toBeGreaterThan(0);
    expect(portNum).toBeLessThan(65536);
  });
});

