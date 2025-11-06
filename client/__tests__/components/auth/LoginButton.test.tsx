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

