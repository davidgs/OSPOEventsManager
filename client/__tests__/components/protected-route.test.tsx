import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ProtectedRoute } from '@/components/protected-route';

// Mock dependencies
const mockSetLocation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation],
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when not initialized', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        initialized: false,
        user: null,
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show "Verifying authentication..." message', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        initialized: false,
        user: null,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
    });

    it('should not redirect while loading', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        initialized: false,
        user: null,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockSetLocation).not.toHaveBeenCalled();
    });

    it('should not render children while loading', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        initialized: false,
        user: null,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['user'] },
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not redirect when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['user'] },
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockSetLocation).not.toHaveBeenCalled();
      });
    });

    it('should not show loading state when authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['user'] },
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        initialized: true,
        user: null,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/login');
      });
    });

    it('should not render children when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        initialized: true,
        user: null,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should render children when user has required role', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['admin', 'user'] },
      });

      render(
        <ProtectedRoute requiredRoles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('should redirect to unauthorized when missing required role', async () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['user'] },
      });

      render(
        <ProtectedRoute requiredRoles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should not render children when missing required role', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['user'] },
      });

      render(
        <ProtectedRoute requiredRoles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should allow access when user has any of the required roles', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: ['editor'] },
      });

      render(
        <ProtectedRoute requiredRoles={['admin', 'editor', 'moderator']}>
          <div>Editor Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Editor Content')).toBeInTheDocument();
    });

    it('should render children when no required roles specified', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: [] },
      });

      render(
        <ProtectedRoute>
          <div>Any User Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Any User Content')).toBeInTheDocument();
    });

    it('should handle user with no roles', async () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: [] },
      });

      render(
        <ProtectedRoute requiredRoles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should handle user with undefined roles', async () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: undefined },
      });

      render(
        <ProtectedRoute requiredRoles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/unauthorized');
      });
    });
  });

  describe('Console Logging', () => {
    it('should log component render', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: '1', username: 'test', email: 'test@example.com', name: 'Test', roles: [] },
      });

      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(consoleSpy).toHaveBeenCalledWith('[PROTECTED_ROUTE] Component render started');
    });

    it('should log current state', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      mockUseAuth.mockReturnValue({
        authenticated: true,
        initialized: true,
        user: { id: 'test-id', username: 'testuser', email: 'test@example.com', name: 'Test', roles: ['user'] },
      });

      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PROTECTED_ROUTE] Current state:',
        expect.objectContaining({
          authenticated: true,
          initialized: true,
          user: expect.objectContaining({ id: 'test-id', username: 'testuser' }),
        })
      );
    });
  });
});

