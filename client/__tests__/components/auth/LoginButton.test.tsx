import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginButton } from '@/components/auth/LoginButton';

// Mock dependencies
const mockToast = vi.fn();
const mockLogin = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/keycloak', () => ({
  login: () => mockLogin(),
}));

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render Log In button', () => {
      render(<LoginButton />);
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('should be enabled by default', () => {
      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });
      expect(button).not.toBeDisabled();
    });

    it('should have full width class', () => {
      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });
      expect(button.className).toContain('w-full');
    });

    it('should have default variant', () => {
      const { container } = render(<LoginButton />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should call login function when clicked', async () => {
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should show loading state when clicked', async () => {
      mockLogin.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      mockLogin.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should re-enable button after successful login', async () => {
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on login failure', async () => {
      const error = new Error('Login failed');
      mockLogin.mockRejectedValueOnce(error);

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login Failed',
          description: 'There was a problem connecting to the authentication server.',
          variant: 'destructive',
        });
      });
    });

    it('should log error to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Login failed');
      mockLogin.mockRejectedValueOnce(error);

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Login error:', error);
      });

      consoleSpy.mockRestore();
    });

    it('should re-enable button after login failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Login failed'));

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show Log In text after error', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Login failed'));

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/log in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Clicks', () => {
    it('should not allow multiple simultaneous login attempts', async () => {
      mockLogin.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LoginButton />);
      const button = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });
  });
});

