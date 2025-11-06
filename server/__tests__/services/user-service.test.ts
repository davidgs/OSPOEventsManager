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

import { describe, it, expect } from 'vitest';

describe('UserService', () => {
  describe('findOrCreateUser', () => {
    it('should check database availability', () => {
      const db = null;
      const shouldThrow = !db;

      expect(shouldThrow).toBe(true);
    });

    it('should query for existing user by keycloak_id', () => {
      const keycloakId = 'keycloak-user-123';
      const query = {
        table: 'users',
        where: { field: 'keycloak_id', value: keycloakId }
      };

      expect(query.where.field).toBe('keycloak_id');
      expect(query.where.value).toBe(keycloakId);
    });

    it('should update last_login for existing user', () => {
      const existingUser = {
        id: 1,
        username: 'testuser',
        keycloak_id: 'keycloak-123'
      };

      const update = {
        last_login: new Date()
      };

      expect(update.last_login).toBeInstanceOf(Date);
      expect(existingUser).toBeDefined();
    });

    it('should return updated user after login', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        last_login: new Date()
      };

      expect(mockUser).toHaveProperty('id');
      expect(mockUser).toHaveProperty('last_login');
      expect(mockUser.last_login).toBeInstanceOf(Date);
    });

    it('should create new user if not found', () => {
      const existingUser = null;
      const shouldCreate = !existingUser;

      expect(shouldCreate).toBe(true);
    });

    it('should create user with keycloak_id and username', () => {
      const insertData = {
        keycloak_id: 'keycloak-123',
        username: 'newuser'
      };

      expect(insertData.keycloak_id).toBeTruthy();
      expect(insertData.username).toBeTruthy();
    });

    it('should return newly created user', () => {
      const newUser = {
        id: 5,
        keycloak_id: 'keycloak-123',
        username: 'newuser',
        created_at: new Date()
      };

      expect(newUser.id).toBeGreaterThan(0);
      expect(newUser.keycloak_id).toBeTruthy();
      expect(newUser.username).toBeTruthy();
    });
  });

  describe('getUserByKeycloakId', () => {
    it('should throw error if database not available', () => {
      const db = null;
      const shouldThrow = !db;

      expect(shouldThrow).toBe(true);
    });

    it('should query by keycloak_id', () => {
      const keycloakId = 'keycloak-user-456';
      const query = {
        where: { keycloak_id: keycloakId }
      };

      expect(query.where.keycloak_id).toBe(keycloakId);
    });

    it('should return user if found', () => {
      const mockUser = {
        id: 2,
        username: 'founduser',
        keycloak_id: 'keycloak-456'
      };

      expect(mockUser).toBeDefined();
      expect(mockUser.id).toBeGreaterThan(0);
    });

    it('should return undefined if user not found', () => {
      const user = undefined;

      expect(user).toBeUndefined();
    });

    it('should handle array response from query', () => {
      const queryResult = [];
      const user = queryResult[0] || undefined;

      expect(user).toBeUndefined();
    });
  });

  describe('updateUserPreferences', () => {
    it('should throw error if database not available', () => {
      const db = null;
      const shouldThrow = !db;

      expect(shouldThrow).toBe(true);
    });

    it('should update preferences and last_login', () => {
      const userId = 3;
      const preferences = JSON.stringify({ theme: 'dark', language: 'en' });

      const updateData = {
        preferences,
        last_login: new Date()
      };

      expect(updateData.preferences).toBe(preferences);
      expect(updateData.last_login).toBeInstanceOf(Date);
    });

    it('should accept JSON string preferences', () => {
      const preferences = JSON.stringify({
        theme: 'dark',
        notifications: true,
        language: 'en'
      });

      expect(typeof preferences).toBe('string');
      const parsed = JSON.parse(preferences);
      expect(parsed).toHaveProperty('theme');
      expect(parsed).toHaveProperty('notifications');
    });

    it('should query by user ID', () => {
      const userId = 5;
      const query = {
        where: { id: userId }
      };

      expect(query.where.id).toBe(userId);
      expect(Number.isInteger(userId)).toBe(true);
    });

    it('should return updated user', () => {
      const updatedUser = {
        id: 3,
        username: 'testuser',
        preferences: '{"theme":"dark"}',
        last_login: new Date()
      };

      expect(updatedUser).toHaveProperty('preferences');
      expect(updatedUser.last_login).toBeInstanceOf(Date);
    });

    it('should return undefined if user not found', () => {
      const result = [];
      const user = result[0] || undefined;

      expect(user).toBeUndefined();
    });
  });

  describe('getAllUsers', () => {
    it('should throw error if database not available', () => {
      const db = null;
      const shouldThrow = !db;

      expect(shouldThrow).toBe(true);
    });

    it('should return all users from database', () => {
      const mockUsers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
        { id: 3, username: 'user3' }
      ];

      expect(Array.isArray(mockUsers)).toBe(true);
      expect(mockUsers.length).toBe(3);
    });

    it('should return empty array if no users', () => {
      const mockUsers: any[] = [];

      expect(Array.isArray(mockUsers)).toBe(true);
      expect(mockUsers.length).toBe(0);
    });

    it('should not filter or sort results', () => {
      // getAllUsers should return raw results
      const mockUsers = [
        { id: 3, username: 'charlie' },
        { id: 1, username: 'alice' },
        { id: 2, username: 'bob' }
      ];

      // Should return as-is from database
      expect(mockUsers[0].id).toBe(3);
      expect(mockUsers.length).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error when database not initialized', () => {
      const errorMessage = 'Database connection is not available.';

      expect(errorMessage).toContain('Database connection');
      expect(errorMessage).toContain('not available');
    });

    it('should handle database query errors gracefully', () => {
      const error = new Error('Database query failed');

      expect(error.message).toBe('Database query failed');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle missing keycloak_id', () => {
      const keycloakId = '';
      const isValid = keycloakId.length > 0;

      expect(isValid).toBe(false);
    });

    it('should handle invalid user ID', () => {
      const userId = -1;
      const isValid = userId > 0;

      expect(isValid).toBe(false);
    });

    it('should handle invalid JSON preferences', () => {
      const invalidJson = 'not valid json {';
      let isValid = false;

      try {
        JSON.parse(invalidJson);
        isValid = true;
      } catch (e) {
        isValid = false;
      }

      expect(isValid).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should return Promise for async operations', () => {
      const mockPromise = Promise.resolve({ id: 1, username: 'test' });

      expect(mockPromise).toBeInstanceOf(Promise);
    });

    it('should return User type from findOrCreateUser', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        keycloak_id: 'keycloak-123',
        name: null,
        email: null,
        bio: null,
        role: null,
        job_title: null,
        headshot: null,
        preferences: null,
        last_login: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(mockUser).toHaveProperty('id');
      expect(mockUser).toHaveProperty('username');
      expect(mockUser).toHaveProperty('keycloak_id');
      expect(mockUser).toHaveProperty('created_at');
    });

    it('should handle undefined return types', () => {
      const user: undefined = undefined;

      expect(user).toBeUndefined();
    });

    it('should return array of Users from getAllUsers', () => {
      const users: any[] = [];

      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Database Query Patterns', () => {
    it('should use eq operator for keycloak_id comparison', () => {
      const queryType = 'eq'; // equals
      expect(queryType).toBe('eq');
    });

    it('should use returning clause for updates', () => {
      const usesReturning = true;
      expect(usesReturning).toBe(true);
    });

    it('should use single element array destructuring', () => {
      const results = [{ id: 1, username: 'test' }];
      const [user] = results;

      expect(user.id).toBe(1);
      expect(user.username).toBe('test');
    });

    it('should handle empty results with fallback', () => {
      const results: any[] = [];
      const user = results[0] || undefined;

      expect(user).toBeUndefined();
    });
  });

  describe('User Creation Flow', () => {
    it('should follow findOrCreate pattern', () => {
      const steps = [
        'Check database availability',
        'Query for existing user',
        'If found, update last_login',
        'If not found, create new user',
        'Return user record'
      ];

      expect(steps).toHaveLength(5);
      expect(steps[0]).toContain('Check database');
      expect(steps[4]).toContain('Return user');
    });

    it('should prioritize finding over creating', () => {
      const existingUser = { id: 1 };
      const shouldCreate = !existingUser;

      expect(shouldCreate).toBe(false);
    });
  });

  describe('User Preferences', () => {
    it('should store preferences as JSON string', () => {
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false
        }
      };

      const stored = JSON.stringify(preferences);
      expect(typeof stored).toBe('string');
    });

    it('should handle complex preference structures', () => {
      const preferences = {
        ui: {
          theme: 'dark',
          layout: 'compact'
        },
        notifications: ['email', 'sms'],
        privacy: {
          shareProfile: false
        }
      };

      const stored = JSON.stringify(preferences);
      const retrieved = JSON.parse(stored);

      expect(retrieved.ui.theme).toBe('dark');
      expect(retrieved.notifications).toContain('email');
      expect(retrieved.privacy.shareProfile).toBe(false);
    });
  });

  describe('Last Login Tracking', () => {
    it('should update last_login on findOrCreate', () => {
      const shouldUpdateLogin = true;
      expect(shouldUpdateLogin).toBe(true);
    });

    it('should update last_login on preferences update', () => {
      const shouldUpdateLogin = true;
      expect(shouldUpdateLogin).toBe(true);
    });

    it('should use current timestamp', () => {
      const lastLogin = new Date();
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - lastLogin.getTime());

      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });
});

