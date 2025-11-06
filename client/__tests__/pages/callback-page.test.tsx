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
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import CallbackPage from '@/pages/callback-page';

// Mock dependencies
const mockSetLocation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => [null, mockSetLocation],
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('CallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner', () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      const { container } = render(<CallbackPage />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render processing message', () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      render(<CallbackPage />);
      expect(screen.getByText('Processing authentication...')).toBeInTheDocument();
    });

    it('should not redirect when not initialized', () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      render(<CallbackPage />);
      expect(mockSetLocation).not.toHaveBeenCalled();
    });
  });

  describe('Successful Authentication', () => {
    it('should redirect to home when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: true,
      });

      render(<CallbackPage />);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/');
      });
    });

    it('should only redirect once', async () => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: true,
      });

      render(<CallbackPage />);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Failed Authentication', () => {
    it('should redirect to auth page when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });

      render(<CallbackPage />);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/auth');
      });
    });

    it('should still show loading message during redirect', () => {
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });

      render(<CallbackPage />);
      expect(screen.getByText('Processing authentication...')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should wait for initialization before redirecting', async () => {
      // Start with not initialized
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      const { rerender } = render(<CallbackPage />);
      expect(mockSetLocation).not.toHaveBeenCalled();

      // Simulate initialization completing with authentication
      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: true,
      });

      rerender(<CallbackPage />);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/');
      });
    });

    it('should handle initialization without authentication', async () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      const { rerender } = render(<CallbackPage />);

      mockUseAuth.mockReturnValue({
        initialized: true,
        authenticated: false,
      });

      rerender(<CallbackPage />);

      await waitFor(() => {
        expect(mockSetLocation).toHaveBeenCalledWith('/auth');
      });
    });
  });

  describe('Rendering', () => {
    it('should center content on screen', () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      const { container } = render(<CallbackPage />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('min-h-screen');
      expect(wrapper.className).toContain('flex');
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('justify-center');
    });

    it('should have proper spinner styling', () => {
      mockUseAuth.mockReturnValue({
        initialized: false,
        authenticated: false,
      });

      const { container } = render(<CallbackPage />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.className).toContain('rounded-full');
      expect(spinner?.className).toContain('border-b-2');
      expect(spinner?.className).toContain('border-primary');
    });
  });
});

