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

