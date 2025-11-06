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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Keycloak from 'keycloak-js';

// Mock Keycloak
vi.mock('keycloak-js', () => {
  const mockKeycloak = {
    init: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearToken: vi.fn(),
    updateToken: vi.fn(),
    hasRealmRole: vi.fn(),
    authenticated: false,
    token: null,
    tokenParsed: null,
    subject: null,
    authServerUrl: 'https://keycloak.example.com/auth',
    realm: 'ospo-events',
    clientId: 'ospo-events-app',
    onTokenExpired: null,
  };

  return {
    default: vi.fn(() => mockKeycloak),
  };
});

describe('Keycloak Integration', () => {
  let mockKeycloak: any;
  let originalFetch: typeof global.fetch;
  let originalLocation: Location;

  beforeEach(() => {
    // Reset modules to get fresh instances
    vi.resetModules();

    // Get the mocked Keycloak instance
    mockKeycloak = new (Keycloak as any)();

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = vi.fn();

    // Mock window.location
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      origin: 'https://example.com',
      href: 'https://example.com/',
      replace: vi.fn(),
    } as any;

    // Reset Keycloak mock state
    mockKeycloak.authenticated = false;
    mockKeycloak.token = null;
    mockKeycloak.tokenParsed = null;
    mockKeycloak.init.mockClear();
    mockKeycloak.login.mockClear();
    mockKeycloak.register.mockClear();
    mockKeycloak.logout.mockClear();
    mockKeycloak.clearToken.mockClear();
    mockKeycloak.updateToken.mockClear();
    mockKeycloak.hasRealmRole.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  describe('initKeycloak', () => {
    it('should initialize Keycloak with server config', async () => {
      const mockConfig = {
        'auth-server-url': 'https://keycloak.example.com/auth',
        realm: 'ospo-events',
        resource: 'ospo-events-app',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      mockKeycloak.init.mockResolvedValueOnce(true);

      const { initKeycloak } = await import('@/lib/keycloak');
      const result = await initKeycloak();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/keycloak-config');
      expect(mockKeycloak.init).toHaveBeenCalledWith({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        enableLogging: false,
      });
    });

    it('should fall back to environment variable if server config fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Mock import.meta.env
      vi.stubEnv('VITE_KEYCLOAK_URL', 'https://env-keycloak.example.com/auth');

      mockKeycloak.init.mockResolvedValueOnce(false);

      const { initKeycloak } = await import('@/lib/keycloak');
      const result = await initKeycloak();

      expect(result).toBe(false);
    });

    it('should handle relative Keycloak URL', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      vi.stubEnv('VITE_KEYCLOAK_URL', '/auth');
      mockKeycloak.init.mockResolvedValueOnce(true);

      const { initKeycloak } = await import('@/lib/keycloak');
      await initKeycloak();

      // Keycloak should be initialized with origin + relative path
      expect(mockKeycloak.init).toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      mockKeycloak.init.mockRejectedValueOnce(new Error('Init failed'));

      const { initKeycloak } = await import('@/lib/keycloak');
      const result = await initKeycloak();

      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('should initiate login with redirect URI', async () => {
      mockKeycloak.login.mockResolvedValueOnce(undefined);

      const { initKeycloak, login } = await import('@/lib/keycloak');
      await initKeycloak();
      await login();

      expect(mockKeycloak.login).toHaveBeenCalledWith({
        redirectUri: window.location.origin,
        loginHint: '',
      });
    });

    it('should handle login error with fallback', async () => {
      mockKeycloak.login.mockRejectedValueOnce(new Error('Login failed'));

      const { initKeycloak, login } = await import('@/lib/keycloak');
      await initKeycloak();

      // Should not throw, uses fallback redirect
      await expect(login()).resolves.not.toThrow();
    });
  });

  describe('register', () => {
    it('should initiate registration', async () => {
      mockKeycloak.register.mockResolvedValueOnce(undefined);

      const { initKeycloak, register } = await import('@/lib/keycloak');
      await initKeycloak();
      await register();

      expect(mockKeycloak.register).toHaveBeenCalled();
    });

    it('should handle registration error with fallback', async () => {
      mockKeycloak.register.mockRejectedValueOnce(new Error('Registration failed'));

      const { initKeycloak, register } = await import('@/lib/keycloak');
      await initKeycloak();

      // Should not throw, uses fallback redirect
      await expect(register()).resolves.not.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear tokens and redirect to login', async () => {
      mockKeycloak.token = 'mock-token';
      mockKeycloak.authenticated = true;

      const { initKeycloak, logout } = await import('@/lib/keycloak');
      await initKeycloak();
      await logout();

      expect(mockKeycloak.clearToken).toHaveBeenCalled();
      expect(window.location.replace).toHaveBeenCalledWith('/login');
    });

    it('should handle logout error gracefully', async () => {
      mockKeycloak.clearToken.mockImplementationOnce(() => {
        throw new Error('Clear token failed');
      });

      const { initKeycloak, logout } = await import('@/lib/keycloak');
      await initKeycloak();

      // Should not throw, falls back to redirect
      await expect(logout()).resolves.not.toThrow();
      expect(window.location.replace).toHaveBeenCalledWith('/login');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated with token', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = 'mock-token';

      const { initKeycloak, isAuthenticated } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      mockKeycloak.authenticated = false;
      mockKeycloak.token = null;

      const { initKeycloak, isAuthenticated } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when authenticated but no token', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = null;

      const { initKeycloak, isAuthenticated } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getUserInfo', () => {
    it('should return user info when authenticated', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.tokenParsed = {
        sub: 'user-123',
        preferred_username: 'testuser',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        name: 'Test User',
        realm_access: {
          roles: ['user', 'admin'],
        },
      };

      const { initKeycloak, getUserInfo } = await import('@/lib/keycloak');
      await initKeycloak();

      const userInfo = getUserInfo();

      expect(userInfo).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        roles: ['user', 'admin'],
      });
    });

    it('should return null when not authenticated', async () => {
      mockKeycloak.authenticated = false;

      const { initKeycloak, getUserInfo } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(getUserInfo()).toBeNull();
    });

    it('should handle missing token fields', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.tokenParsed = {
        sub: 'user-123',
      };

      const { initKeycloak, getUserInfo } = await import('@/lib/keycloak');
      await initKeycloak();

      const userInfo = getUserInfo();

      expect(userInfo).toEqual({
        id: 'user-123',
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        name: '',
        roles: [],
      });
    });

    it('should handle parse error', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.tokenParsed = null;

      const { initKeycloak, getUserInfo } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(getUserInfo()).toBeNull();
    });
  });

  describe('getAuthHeaders', () => {
    it('should return Authorization header when authenticated', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = 'mock-token-123';

      const { initKeycloak, getAuthHeaders } = await import('@/lib/keycloak');
      await initKeycloak();

      const headers = getAuthHeaders();

      expect(headers).toEqual({
        Authorization: 'Bearer mock-token-123',
      });
    });

    it('should return empty object when not authenticated', async () => {
      mockKeycloak.authenticated = false;
      mockKeycloak.token = null;

      const { initKeycloak, getAuthHeaders } = await import('@/lib/keycloak');
      await initKeycloak();

      const headers = getAuthHeaders();

      expect(headers).toEqual({});
    });

    it('should return empty object when no token', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = null;

      const { initKeycloak, getAuthHeaders } = await import('@/lib/keycloak');
      await initKeycloak();

      const headers = getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('withAuth', () => {
    it('should add auth headers to fetch options', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = 'mock-token';

      const { initKeycloak, withAuth } = await import('@/lib/keycloak');
      await initKeycloak();

      const options = withAuth({ method: 'GET' });

      expect(options).toEqual({
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });
    });

    it('should merge with existing headers', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = 'mock-token';

      const { initKeycloak, withAuth } = await import('@/lib/keycloak');
      await initKeycloak();

      const options = withAuth({
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      });
    });

    it('should return options unchanged when not authenticated', async () => {
      mockKeycloak.authenticated = false;

      const { initKeycloak, withAuth } = await import('@/lib/keycloak');
      await initKeycloak();

      const originalOptions = { method: 'GET' };
      const options = withAuth(originalOptions);

      expect(options).toEqual(originalOptions);
    });

    it('should handle empty options', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.token = 'mock-token';

      const { initKeycloak, withAuth } = await import('@/lib/keycloak');
      await initKeycloak();

      const options = withAuth();

      expect(options.headers).toEqual({
        Authorization: 'Bearer mock-token',
      });
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.hasRealmRole.mockReturnValue(true);

      const { initKeycloak, hasRole } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(hasRole('admin')).toBe(true);
      expect(mockKeycloak.hasRealmRole).toHaveBeenCalledWith('admin');
    });

    it('should return false when user does not have role', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.hasRealmRole.mockReturnValue(false);

      const { initKeycloak, hasRole } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(hasRole('admin')).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      mockKeycloak.authenticated = false;

      const { initKeycloak, hasRole } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(hasRole('admin')).toBe(false);
      expect(mockKeycloak.hasRealmRole).not.toHaveBeenCalled();
    });

    it('should handle hasRealmRole error', async () => {
      mockKeycloak.authenticated = true;
      mockKeycloak.hasRealmRole.mockImplementation(() => {
        throw new Error('Role check failed');
      });

      const { initKeycloak, hasRole } = await import('@/lib/keycloak');
      await initKeycloak();

      expect(hasRole('admin')).toBe(false);
    });
  });
});

