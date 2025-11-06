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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';

describe('StatusBadge', () => {
  describe('Status Rendering', () => {
    it('should render pending status', () => {
      render(<StatusBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render approved status', () => {
      render(<StatusBadge status="approved" />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should render rejected status', () => {
      render(<StatusBadge status="rejected" />);
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should render in progress status', () => {
      render(<StatusBadge status="in_progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should render completed status', () => {
      render(<StatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should render draft status', () => {
      render(<StatusBadge status="draft" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should render published status', () => {
      render(<StatusBadge status="published" />);
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon by default', () => {
      const { container } = render(<StatusBadge status="pending" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not render icon when showIcon is false', () => {
      const { container } = render(<StatusBadge status="pending" showIcon={false} />);
      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    it('should render icon for pending', () => {
      const { container } = render(<StatusBadge status="pending" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon for approved', () => {
      const { container } = render(<StatusBadge status="approved" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon for rejected', () => {
      const { container } = render(<StatusBadge status="rejected" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon for changes requested', () => {
      const { container } = render(<StatusBadge status="changes_requested" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Color Classes', () => {
    it('should apply yellow colors for pending', () => {
      const { container } = render(<StatusBadge status="pending" />);
      const badge = container.querySelector('[class*="bg-yellow"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply green colors for approved', () => {
      const { container } = render(<StatusBadge status="approved" />);
      const badge = container.querySelector('[class*="bg-green"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply red colors for rejected', () => {
      const { container } = render(<StatusBadge status="rejected" />);
      const badge = container.querySelector('[class*="bg-red"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply orange colors for changes requested', () => {
      const { container } = render(<StatusBadge status="changes_requested" />);
      const badge = container.querySelector('[class*="bg-orange"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply blue colors for in progress', () => {
      const { container } = render(<StatusBadge status="in_progress" />);
      const badge = container.querySelector('[class*="bg-blue"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply emerald colors for completed', () => {
      const { container } = render(<StatusBadge status="completed" />);
      const badge = container.querySelector('[class*="bg-emerald"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply gray colors for cancelled', () => {
      const { container } = render(<StatusBadge status="cancelled" />);
      const badge = container.querySelector('[class*="bg-gray"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Status Aliases', () => {
    it('should handle "accepted" as "approved"', () => {
      render(<StatusBadge status="accepted" />);
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('should handle "declined" as "rejected"', () => {
      render(<StatusBadge status="declined" />);
      expect(screen.getByText('Declined')).toBeInTheDocument();
    });

    it('should handle "in progress" with space', () => {
      render(<StatusBadge status="in progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('should handle "changes requested" with space', () => {
      render(<StatusBadge status="changes requested" />);
      expect(screen.getByText('Changes Requested')).toBeInTheDocument();
    });

    it('should handle "done" as "completed"', () => {
      render(<StatusBadge status="done" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should handle "canceled" (American spelling)', () => {
      render(<StatusBadge status="canceled" />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('should handle "active" similar to "published"', () => {
      render(<StatusBadge status="active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase status', () => {
      render(<StatusBadge status="PENDING" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should handle mixed case status', () => {
      render(<StatusBadge status="ApProVeD" />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should apply correct colors regardless of case', () => {
      const { container } = render(<StatusBadge status="PENDING" />);
      const badge = container.querySelector('[class*="bg-yellow"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Type Parameter', () => {
    it('should accept general type', () => {
      render(<StatusBadge status="pending" type="general" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should accept approval type', () => {
      render(<StatusBadge status="approved" type="approval" />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should accept cfp type', () => {
      render(<StatusBadge status="accepted" type="cfp" />);
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('should accept event type', () => {
      render(<StatusBadge status="active" type="event" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <StatusBadge status="pending" className="custom-class" />
      );
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });

    it('should add flex and items-center classes when icon is shown', () => {
      const { container } = render(<StatusBadge status="pending" showIcon={true} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('flex');
      expect(badge.className).toContain('items-center');
      expect(badge.className).toContain('gap-1');
    });

    it('should not add gap class when icon is hidden', () => {
      const { container } = render(<StatusBadge status="pending" showIcon={false} />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).not.toContain('gap-1');
    });
  });

  describe('Unknown Status', () => {
    it('should capitalize unknown status', () => {
      render(<StatusBadge status="custom" />);
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should apply gray colors for unknown status', () => {
      const { container } = render(<StatusBadge status="custom" />);
      const badge = container.querySelector('[class*="bg-gray"]');
      expect(badge).toBeInTheDocument();
    });

    it('should render User icon for unknown status', () => {
      const { container } = render(<StatusBadge status="custom" />);
      const icon = container.querySelector('.lucide-user');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Icon Size', () => {
    it('should render icon with correct size classes', () => {
      const { container } = render(<StatusBadge status="pending" />);
      const icon = container.querySelector('.h-3.w-3');
      expect(icon).toBeInTheDocument();
    });
  });
});

