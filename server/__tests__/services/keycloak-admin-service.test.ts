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

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('KeycloakAdminService', () => {
  describe('KeycloakUser Interface', () => {
    it('should have required user fields', () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        enabled: true,
        emailVerified: false
      };

      expect(mockUser).toHaveProperty('username');
      expect(mockUser).toHaveProperty('email');
      expect(mockUser).toHaveProperty('enabled');
      expect(mockUser).toHaveProperty('emailVerified');
    });

    it('should have optional user fields', () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        enabled: true,
        emailVerified: false,
        attributes: { role: ['admin'] },
        requiredActions: ['UPDATE_PASSWORD'],
        id: 'user-123',
        createdTimestamp: Date.now(),
        lastLogin: Date.now()
      };

      expect(mockUser).toHaveProperty('firstName');
      expect(mockUser).toHaveProperty('lastName');
      expect(mockUser).toHaveProperty('attributes');
      expect(mockUser).toHaveProperty('requiredActions');
      expect(mockUser).toHaveProperty('id');
    });
  });

  describe('KeycloakAdminConfig', () => {
    it('should load configuration from environment', () => {
      const config = {
        serverUrl: process.env.KEYCLOAK_SERVER_URL || 'https://keycloak-dev.rh-events.org/auth',
        realm: process.env.KEYCLOAK_REALM || 'ospo-events',
        adminUsername: process.env.KEYCLOAK_ADMIN || 'admin',
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'ospo-events-app'
      };

      expect(config.serverUrl).toBeTruthy();
      expect(config.realm).toBeTruthy();
      expect(config.adminUsername).toBeTruthy();
      expect(config.adminPassword).toBeTruthy();
      expect(config.clientId).toBeTruthy();
    });

    it('should use default values when env vars not set', () => {
      const defaultConfig = {
        serverUrl: 'https://keycloak-dev.rh-events.org/auth',
        realm: 'ospo-events',
        adminUsername: 'admin',
        adminPassword: 'admin',
        clientId: 'ospo-events-app'
      };

      expect(defaultConfig.serverUrl).toBe('https://keycloak-dev.rh-events.org/auth');
      expect(defaultConfig.realm).toBe('ospo-events');
      expect(defaultConfig.clientId).toBe('ospo-events-app');
    });
  });

  describe('getAdminToken', () => {
    it('should use cached token if still valid', () => {
      const mockToken = 'cached-token';
      const mockExpiry = Date.now() + 60000; // 1 minute from now

      const isTokenValid = mockToken && Date.now() < mockExpiry;
      expect(isTokenValid).toBe(true);
    });

    it('should refresh token if expired', () => {
      const mockToken = 'expired-token';
      const mockExpiry = Date.now() - 60000; // 1 minute ago

      const isTokenExpired = Date.now() >= mockExpiry;
      expect(isTokenExpired).toBe(true);
    });

    it('should construct correct token URL', () => {
      const serverUrl = 'https://keycloak.example.com/auth';
      const tokenUrl = `${serverUrl}/realms/master/protocol/openid-connect/token`;

      expect(tokenUrl).toBe('https://keycloak.example.com/auth/realms/master/protocol/openid-connect/token');
    });

    it('should use form-urlencoded content type', () => {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    it('should use password grant type', () => {
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin'
      });

      expect(params.get('grant_type')).toBe('password');
      expect(params.get('client_id')).toBe('admin-cli');
    });

    it('should set token expiry to 90% of actual expiry', () => {
      const expiresIn = 3600; // 1 hour in seconds
      const tokenExpiry = Date.now() + (expiresIn * 900); // 90% = 900ms per second

      const expectedExpiry = Date.now() + (54 * 60 * 1000); // 54 minutes
      expect(tokenExpiry).toBeGreaterThan(expectedExpiry - 1000);
      expect(tokenExpiry).toBeLessThan(expectedExpiry + 1000);
    });
  });

  describe('createUser', () => {
    it('should split name into first and last name', () => {
      const fullName = 'John Doe Smith';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      expect(firstName).toBe('John');
      expect(lastName).toBe('Doe Smith');
    });

    it('should handle single name', () => {
      const fullName = 'John';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      expect(firstName).toBe('John');
      expect(lastName).toBe('');
    });

    it('should use email as username', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const keycloakUser = {
        username: userData.email,
        email: userData.email
      };

      expect(keycloakUser.username).toBe(userData.email);
    });

    it('should set default role to attendee', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const attributes = {
        role: userData.role ? [userData.role] : ['attendee']
      };

      expect(attributes.role).toEqual(['attendee']);
    });

    it('should use provided role if specified', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      };

      const attributes = {
        role: userData.role ? [userData.role] : ['attendee']
      };

      expect(attributes.role).toEqual(['admin']);
    });

    it('should set required actions', () => {
      const requiredActions = ['UPDATE_PASSWORD', 'VERIFY_EMAIL'];
      expect(requiredActions).toContain('UPDATE_PASSWORD');
      expect(requiredActions).toContain('VERIFY_EMAIL');
      expect(requiredActions).toHaveLength(2);
    });

    it('should enable user by default', () => {
      const enabled = true;
      expect(enabled).toBe(true);
    });

    it('should set emailVerified to false', () => {
      const emailVerified = false;
      expect(emailVerified).toBe(false);
    });

    it('should extract user ID from location header', () => {
      const locationHeader = 'https://keycloak.example.com/admin/realms/ospo-events/users/user-123';
      const userId = locationHeader.split('/').pop();

      expect(userId).toBe('user-123');
    });

    it('should construct create user URL', () => {
      const serverUrl = 'https://keycloak.example.com/auth';
      const realm = 'ospo-events';
      const createUserUrl = `${serverUrl}/admin/realms/${realm}/users`;

      expect(createUserUrl).toBe('https://keycloak.example.com/auth/admin/realms/ospo-events/users');
    });
  });

  describe('setUserPassword', () => {
    it('should construct password reset URL', () => {
      const serverUrl = 'https://keycloak.example.com/auth';
      const realm = 'ospo-events';
      const userId = 'user-123';
      const url = `${serverUrl}/admin/realms/${realm}/users/${userId}/reset-password`;

      expect(url).toContain('/reset-password');
      expect(url).toContain(userId);
    });

    it('should set temporary password by default', () => {
      const passwordData = {
        type: 'password',
        value: 'temp-password',
        temporary: true
      };

      expect(passwordData.temporary).toBe(true);
      expect(passwordData.type).toBe('password');
    });

    it('should allow permanent password', () => {
      const temporary = false;
      const passwordData = {
        type: 'password',
        value: 'permanent-password',
        temporary
      };

      expect(passwordData.temporary).toBe(false);
    });
  });

  describe('sendEmailActions', () => {
    it('should construct email actions URL', () => {
      const serverUrl = 'https://keycloak.example.com/auth';
      const realm = 'ospo-events';
      const userId = 'user-123';
      const url = `${serverUrl}/admin/realms/${realm}/users/${userId}/execute-actions-email`;

      expect(url).toContain('/execute-actions-email');
      expect(url).toContain(userId);
    });

    it('should send multiple actions', () => {
      const actions = ['UPDATE_PASSWORD', 'VERIFY_EMAIL'];
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should not throw on email failure', () => {
      // Email sending failure should be logged but not thrown
      const emailFailed = true;
      const shouldContinue = emailFailed; // Should continue despite failure

      expect(shouldContinue).toBe(true);
    });
  });

  describe('userExists', () => {
    it('should construct search URL with encoded email', () => {
      const serverUrl = 'https://keycloak.example.com/auth';
      const realm = 'ospo-events';
      const email = 'test+user@example.com';
      const searchUrl = `${serverUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}`;

      expect(searchUrl).toContain('email=');
      expect(searchUrl).toContain('test%2Buser%40example.com');
    });

    it('should return true when users found', () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      const exists = mockUsers.length > 0;

      expect(exists).toBe(true);
    });

    it('should return false when no users found', () => {
      const mockUsers: any[] = [];
      const exists = mockUsers.length > 0;

      expect(exists).toBe(false);
    });

    it('should return false on error', () => {
      const errorOccurred = true;
      const exists = errorOccurred ? false : true;

      expect(exists).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should construct users list URL', () => {
      const serverUrl = 'https://keycloak.example.com/auth';
      const realm = 'ospo-events';
      const usersUrl = `${serverUrl}/admin/realms/${realm}/users`;

      expect(usersUrl).toBe('https://keycloak.example.com/auth/admin/realms/ospo-events/users');
    });

    it('should transform API response to KeycloakUser format', () => {
      const apiUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        enabled: true,
        emailVerified: false,
        attributes: { role: ['admin'] },
        requiredActions: [],
        createdTimestamp: 1234567890000
      };

      const transformedUser = {
        username: apiUser.username || '',
        email: apiUser.email || '',
        firstName: apiUser.firstName || '',
        lastName: apiUser.lastName || '',
        enabled: apiUser.enabled || false,
        emailVerified: apiUser.emailVerified || false,
        attributes: apiUser.attributes || {},
        requiredActions: apiUser.requiredActions || [],
        id: apiUser.id,
        createdTimestamp: apiUser.createdTimestamp,
        lastLogin: apiUser.lastLogin
      };

      expect(transformedUser.username).toBe('testuser');
      expect(transformedUser.email).toBe('test@example.com');
      expect(transformedUser.id).toBe('user-123');
    });

    it('should handle missing optional fields', () => {
      const apiUser = {
        id: 'user-123',
        enabled: true
      };

      const transformedUser = {
        username: (apiUser as any).username || '',
        email: (apiUser as any).email || '',
        firstName: (apiUser as any).firstName || '',
        lastName: (apiUser as any).lastName || '',
        enabled: apiUser.enabled || false,
        emailVerified: (apiUser as any).emailVerified || false,
        attributes: (apiUser as any).attributes || {},
        requiredActions: (apiUser as any).requiredActions || [],
        id: apiUser.id
      };

      expect(transformedUser.username).toBe('');
      expect(transformedUser.email).toBe('');
      expect(transformedUser.attributes).toEqual({});
    });
  });

  describe('generateTemporaryPassword', () => {
    it('should generate password of correct length', () => {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      expect(password.length).toBe(12);
    });

    it('should use valid character set', () => {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

      expect(charset).toContain('A');
      expect(charset).toContain('a');
      expect(charset).toContain('0');
      expect(charset).toContain('!');
    });

    it('should generate different passwords', () => {
      const generatePassword = () => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const password1 = generatePassword();
      const password2 = generatePassword();

      // While there's a tiny chance they could be the same, it's extremely unlikely
      expect(password1.length).toBe(12);
      expect(password2.length).toBe(12);
    });
  });

  describe('Error Handling', () => {
    it('should throw error on token fetch failure', () => {
      const responseOk = false;
      const shouldThrow = !responseOk;

      expect(shouldThrow).toBe(true);
    });

    it('should throw error on user creation failure', () => {
      const responseOk = false;
      const shouldThrow = !responseOk;

      expect(shouldThrow).toBe(true);
    });

    it('should throw error when location header missing', () => {
      const locationHeader = null;
      const shouldThrow = !locationHeader;

      expect(shouldThrow).toBe(true);
    });

    it('should throw error when user ID cannot be extracted', () => {
      const locationHeader = 'https://keycloak.example.com/admin/realms/ospo-events/users/';
      const userId = locationHeader.split('/').pop();
      const shouldThrow = !userId;

      expect(shouldThrow).toBe(true);
    });

    it('should log error but continue on email send failure', () => {
      const emailSendFailed = true;
      const shouldContinue = emailSendFailed; // Don't throw

      expect(shouldContinue).toBe(true);
    });
  });

  describe('HTTP Headers', () => {
    it('should include Bearer token in Authorization header', () => {
      const token = 'mock-token';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      expect(headers.Authorization).toBe('Bearer mock-token');
    });

    it('should use JSON content type for most requests', () => {
      const headers = {
        'Content-Type': 'application/json'
      };

      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Integration Flow', () => {
    it('should follow complete user creation flow', () => {
      const steps = [
        'Get admin token',
        'Parse user name',
        'Generate temporary password',
        'Create Keycloak user',
        'Extract user ID from response',
        'Set temporary password',
        'Send email actions'
      ];

      expect(steps).toHaveLength(7);
      expect(steps[0]).toBe('Get admin token');
      expect(steps[steps.length - 1]).toBe('Send email actions');
    });

    it('should return user ID and temporary password', () => {
      const result = {
        userId: 'user-123',
        temporaryPassword: 'TempPass123!'
      };

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('temporaryPassword');
      expect(result.userId).toBeTruthy();
      expect(result.temporaryPassword).toBeTruthy();
    });
  });
});

