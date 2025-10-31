import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import EventCard from '@/components/ui/event-card';
import type { Event as SchemaEvent } from '@shared/schema';

// Mock wouter Link component
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockEvent: SchemaEvent = {
  id: 1,
  name: 'Test Event',
  link: 'https://example.com',
  start_date: '2025-01-01',
  end_date: '2025-01-03',
  location: 'Test Location',
  priority: 'high',
  type: 'conference',
  goal: ['networking'],
  status: 'planning',
  created_at: new Date('2025-01-01'),
  updated_at: new Date('2025-01-01'),
} as SchemaEvent;

describe('EventCard', () => {
  const defaultProps = {
    event: mockEvent,
    cfpCount: 0,
    attendeeCount: 0,
    speakers: [],
    attendees: [],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  describe('Creator Information Display', () => {
    it('should display creator name when creator exists', () => {
      const eventWithCreator = {
        ...mockEvent,
        createdByName: 'John Doe',
        createdByAvatar: 'https://example.com/avatar.jpg',
      };

      render(<EventCard {...defaultProps} event={eventWithCreator as any} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display "Unknown User" when creator name is not provided', () => {
      const eventWithoutCreator = {
        ...mockEvent,
        createdByName: null,
        createdByAvatar: null,
      };

      render(<EventCard {...defaultProps} event={eventWithoutCreator as any} />);

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('should display creator avatar when available', () => {
      const eventWithAvatar = {
        ...mockEvent,
        createdByName: 'Jane Smith',
        createdByAvatar: 'https://example.com/avatar.jpg',
      };

      render(<EventCard {...defaultProps} event={eventWithAvatar as any} />);

      const avatarImage = screen.getByAltText('Jane Smith');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should display initial fallback when avatar is not available', () => {
      const eventWithoutAvatar = {
        ...mockEvent,
        createdByName: 'Test User',
        createdByAvatar: null,
      };

      const { container } = render(<EventCard {...defaultProps} event={eventWithoutAvatar as any} />);

      // Should show initial "T" for "Test User"
      const initialElement = container.querySelector('.rounded-full.bg-primary\\/10');
      expect(initialElement).toBeInTheDocument();
      expect(initialElement?.textContent).toBe('T');
    });

    it('should display "U" initial for "Unknown User" when no creator', () => {
      const eventWithoutCreator = {
        ...mockEvent,
        createdByName: null,
        createdByAvatar: null,
      };

      const { container } = render(<EventCard {...defaultProps} event={eventWithoutCreator as any} />);

      const initialElement = container.querySelector('.rounded-full.bg-primary\\/10');
      expect(initialElement).toBeInTheDocument();
      expect(initialElement?.textContent).toBe('U');
    });

    it('should always render creator section in footer', () => {
      const eventWithCreator = {
        ...mockEvent,
        createdByName: 'John Doe',
        createdByAvatar: null,
      };

      render(<EventCard {...defaultProps} event={eventWithCreator as any} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle empty string creator name', () => {
      const eventWithEmptyName = {
        ...mockEvent,
        createdByName: '',
        createdByAvatar: null,
      };

      render(<EventCard {...defaultProps} event={eventWithEmptyName as any} />);

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('should display creator info and "View details" link side by side', () => {
      const eventWithCreator = {
        ...mockEvent,
        createdByName: 'John Doe',
        createdByAvatar: null,
      };

      render(<EventCard {...defaultProps} event={eventWithCreator as any} />);

      // Verify both elements are present
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('View details →')).toBeInTheDocument();
    });
  });

  describe('Event Details', () => {
    it('should render event name', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    it('should render event location', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });
  });
});

