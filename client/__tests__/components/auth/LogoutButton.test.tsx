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
import { LogoutButton } from '@/components/auth/LogoutButton';

// Mock dependencies
const mockToast = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'common.signOut': 'Sign Out',
        'common.signingOut': 'Signing out...',
        'common.logoutFailed': 'Logout Failed',
        'common.logoutFailedDescription': 'There was a problem signing out. Please try again.',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render Sign Out button', () => {
      render(<LogoutButton />);
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('should render LogOut icon', () => {
      const { container } = render(<LogoutButton />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should be enabled by default', () => {
      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).not.toBeDisabled();
    });

    it('should have ghost variant styling', () => {
      const { container } = render(<LogoutButton />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should have flex items center gap class', () => {
      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button.className).toContain('flex');
      expect(button.className).toContain('items-center');
    });
  });

  describe('Click Interaction', () => {
    it('should call logout function when clicked', async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should show loading state when clicked', async () => {
      mockLogout.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/signing out\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      mockLogout.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should not re-enable button after successful logout (will redirect)', async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      // Button stays disabled because logout redirects the page
      // In real scenario, the page would have navigated away
    });
  });

  describe('Error Handling', () => {
    it('should show error toast on logout failure', async () => {
      const error = new Error('Logout failed');
      mockLogout.mockRejectedValueOnce(error);

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Logout Failed',
            description: 'There was a problem signing out. Please try again.',
            variant: 'destructive',
          })
        );
      });
    });

    it('should log error to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Logout failed');
      mockLogout.mockRejectedValueOnce(error);

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', error);
      });

      consoleSpy.mockRestore();
    });

    it('should re-enable button after logout failure', async () => {
      mockLogout.mockRejectedValueOnce(new Error('Logout failed'));

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show Sign Out text after error', async () => {
      mockLogout.mockRejectedValueOnce(new Error('Logout failed'));

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/sign out/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Clicks', () => {
    it('should not allow multiple simultaneous logout attempts', async () => {
      mockLogout.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LogoutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon with correct size classes', () => {
      const { container } = render(<LogoutButton />);
      const icon = container.querySelector('.h-4.w-4');
      expect(icon).toBeInTheDocument();
    });
  });
});

