import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthPage from '@/pages/auth-page';
import React from 'react';

// Mock dependencies
const mockSetLocation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation],
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/auth/LoginButton', () => ({
  LoginButton: () => <button>Login with Keycloak</button>,
}));

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    delete (import.meta as any).env.VITE_KEYCLOAK_URL;
  });

  describe('Initial Render', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });
    });

    it('should render page title', () => {
      render(<AuthPage />);
      expect(screen.getByText('OSPO Events')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<AuthPage />);
      expect(
        screen.getByText(/Sign in to your account to access the event management system/)
      ).toBeInTheDocument();
    });

    it('should render LoginButton component', () => {
      render(<AuthPage />);
      expect(screen.getByText('Login with Keycloak')).toBeInTheDocument();
    });

    it('should render Create an Account button', () => {
      render(<AuthPage />);
      expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument();
    });

    it('should render Calendar icon', () => {
      const { container } = render(<AuthPage />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render terms and privacy notice', () => {
      render(<AuthPage />);
      expect(
        screen.getByText(/By signing up, you agree to our Terms of Service and Privacy Policy/)
      ).toBeInTheDocument();
    });
  });

  describe('Hero Content (Desktop)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });
    });

    it('should render hero heading', () => {
      render(<AuthPage />);
      expect(screen.getByText('Streamline Your OSPO Event Management')).toBeInTheDocument();
    });

    it('should render hero description', () => {
      render(<AuthPage />);
      expect(
        screen.getByText(/Track conferences, manage CFP submissions/)
      ).toBeInTheDocument();
    });

    it('should render feature list', () => {
      render(<AuthPage />);
      expect(screen.getByText(/Centralize all event information/)).toBeInTheDocument();
      expect(screen.getByText(/Streamline approval workflows/)).toBeInTheDocument();
      expect(screen.getByText(/Manage attendees and stakeholders/)).toBeInTheDocument();
      expect(screen.getByText(/Track CFP submissions and sponsorships/)).toBeInTheDocument();
    });
  });

  describe('Create Account Button', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });
    });

    it('should redirect to Keycloak registration on click', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '', origin: 'http://localhost' } as any;

      render(<AuthPage />);
      const createAccountButton = screen.getByRole('button', { name: /create an account/i });

      fireEvent.click(createAccountButton);

      expect(window.location.href).toContain('kc_action=register');
      expect(window.location.href).toContain('ospo-events-app');

      window.location = originalLocation;
    });

    it('should log registration URL', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(<AuthPage />);
      const createAccountButton = screen.getByRole('button', { name: /create an account/i });

      fireEvent.click(createAccountButton);

      expect(consoleSpy).toHaveBeenCalledWith('Registration URL:', expect.stringContaining('register'));

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication Redirect', () => {
    it('should redirect to home when already authenticated', () => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: true,
      });

      render(<AuthPage />);

      expect(mockSetLocation).toHaveBeenCalledWith('/');
    });

    it('should not redirect when not initialized', () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      render(<AuthPage />);

      expect(mockSetLocation).not.toHaveBeenCalled();
    });

    it('should not redirect when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });

      mockSetLocation.mockClear();
      render(<AuthPage />);

      expect(mockSetLocation).not.toHaveBeenCalled();
    });
  });
});

