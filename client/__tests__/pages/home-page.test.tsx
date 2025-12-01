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
import { render, screen } from '@testing-library/react';
import HomePage from '@/pages/home-page';
import React from 'react';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'pages.home.title': 'Event Management System',
        'pages.home.subtitle': 'Track and manage your open source program office events, submissions, and collaborations.',
        'pages.home.signIn': 'Sign In',
        'pages.home.viewEvents': 'View Events',
        'pages.home.features.eventManagement.title': 'Event Management',
        'pages.home.features.eventManagement.description': 'Track conferences, meetups, and workshops',
        'pages.home.features.cfpTracking.title': 'CFP Tracking',
        'pages.home.features.cfpTracking.description': 'Submit and manage call for papers',
        'pages.home.features.attendeeManagement.title': 'Attendee Management',
        'pages.home.features.attendeeManagement.description': 'Manage event participants',
        'pages.home.features.sponsorshipManagement.title': 'Sponsorship Management',
        'pages.home.features.sponsorshipManagement.description': 'Track sponsorships and budgets',
        'common.learnMore': 'Learn More',
        'pages.home.copyright': `© ${params?.year || new Date().getFullYear()} Events. All rights reserved.`,
      };
      return translations[key] || key;
    },
  }),
}));

// Mock I18nProvider
vi.mock('@/components/i18n/i18n-provider', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useI18n: () => ({ language: 'en', setLanguage: vi.fn(), isLoading: false }),
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
      expect(screen.getByText('Event Management System')).toBeInTheDocument();
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

    it('should render all Learn More links', () => {
      render(<HomePage />);
      const learnMoreLinks = screen.getAllByRole('link', { name: /learn more/i });
      expect(learnMoreLinks).toHaveLength(4);
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
      expect(screen.getByText(new RegExp(`© ${currentYear} Events`))).toBeInTheDocument();
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

