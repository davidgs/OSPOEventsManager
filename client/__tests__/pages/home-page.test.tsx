import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/pages/home-page';
import React from 'react';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock wouter Link
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    it('should render the main heading', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        user: null,
        initialized: true,
      });

      render(<HomePage />);
      expect(screen.getByText('OSPO Event Management System')).toBeInTheDocument();
    });

    it('should render the description', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        user: null,
        initialized: true,
      });

      render(<HomePage />);
      expect(
        screen.getByText(/Track and manage your open source program office events/)
      ).toBeInTheDocument();
    });

    it('should show Sign In button when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        user: null,
        initialized: true,
      });

      render(<HomePage />);
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have Sign In button linking to /auth', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        user: null,
        initialized: true,
      });

      render(<HomePage />);
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toHaveAttribute('href', '/auth');
    });
  });

  describe('Authenticated State', () => {
    it('should show View Events button when authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        user: { id: '1', username: 'testuser', email: 'test@example.com', name: 'Test', roles: [] },
        initialized: true,
      });

      render(<HomePage />);
      expect(screen.getByRole('link', { name: /view events/i })).toBeInTheDocument();
    });

    it('should have View Events button linking to /events', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        user: { id: '1', username: 'testuser', email: 'test@example.com', name: 'Test', roles: [] },
        initialized: true,
      });

      render(<HomePage />);
      const viewEventsLink = screen.getByRole('link', { name: /view events/i });
      expect(viewEventsLink).toHaveAttribute('href', '/events');
    });

    it('should not show Sign In button when authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        user: { id: '1', username: 'testuser', email: 'test@example.com', name: 'Test', roles: [] },
        initialized: true,
      });

      render(<HomePage />);
      expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });

  describe('Feature Cards', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        user: null,
        initialized: true,
      });
    });

    it('should render Event Management card', () => {
      render(<HomePage />);
      expect(screen.getByText('Event Management')).toBeInTheDocument();
      expect(screen.getByText(/Track conferences, meetups, and workshops/)).toBeInTheDocument();
    });

    it('should render CFP Tracking card', () => {
      render(<HomePage />);
      expect(screen.getByText('CFP Tracking')).toBeInTheDocument();
      expect(screen.getByText(/Submit and manage call for papers/)).toBeInTheDocument();
    });

    it('should render Attendee Management card', () => {
      render(<HomePage />);
      expect(screen.getByText('Attendee Management')).toBeInTheDocument();
      expect(screen.getByText(/Manage event participants/)).toBeInTheDocument();
    });

    it('should render Sponsorship Management card', () => {
      render(<HomePage />);
      expect(screen.getByText('Sponsorship Management')).toBeInTheDocument();
      expect(screen.getByText(/Track sponsorships and budgets/)).toBeInTheDocument();
    });

    it('should render all Learn More buttons', () => {
      render(<HomePage />);
      const learnMoreButtons = screen.getAllByRole('button', { name: /learn more/i });
      expect(learnMoreButtons).toHaveLength(4);
    });
  });

  describe('Footer', () => {
    it('should render copyright notice', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        user: null,
        initialized: true,
      });

      render(<HomePage />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} OSPO Events`))).toBeInTheDocument();
    });
  });

  describe('Console Logging', () => {
    it('should log authentication state', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      mockUseAuth.mockReturnValue({
        authenticated: true,
        user: { id: 'test-id', username: 'testuser', email: 'test@example.com', name: 'Test', roles: [] },
        initialized: true,
      });

      render(<HomePage />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'HomePage auth state:',
        expect.objectContaining({
          authenticated: true,
          initialized: true,
          user: expect.objectContaining({ id: 'test-id', username: 'testuser' }),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});

