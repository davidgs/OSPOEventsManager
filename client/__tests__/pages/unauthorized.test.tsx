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
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import UnauthorizedPage from '@/pages/unauthorized';

// Mock wouter
const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => [null, mockNavigate],
}));

describe('UnauthorizedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Access Denied heading', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('should render description message', () => {
    render(<UnauthorizedPage />);
    expect(
      screen.getByText(/You don't have permission to access this resource/)
    ).toBeInTheDocument();
  });

  it('should render detailed explanation', () => {
    render(<UnauthorizedPage />);
    expect(
      screen.getByText(/Your account doesn't have the required permissions/)
    ).toBeInTheDocument();
  });

  it('should render ShieldAlert icon', () => {
    const { container } = render(<UnauthorizedPage />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render Go Back button', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('should render Go to Dashboard button', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('should call window.history.back() when Go Back is clicked', () => {
    const backSpy = vi.spyOn(window.history, 'back');
    render(<UnauthorizedPage />);

    const goBackButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(goBackButton);

    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('should navigate to home when Go to Dashboard is clicked', () => {
    render(<UnauthorizedPage />);

    const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
    fireEvent.click(dashboardButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should have proper card structure', () => {
    const { container } = render(<UnauthorizedPage />);
    expect(container.querySelector('[class*="Card"]')).toBeInTheDocument();
  });
});

