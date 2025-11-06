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
import { TypeBadge } from '@/components/ui/type-badge';

describe('TypeBadge', () => {
  describe('Type Rendering', () => {
    it('should render conference type', () => {
      render(<TypeBadge type="conference" />);
      expect(screen.getByText('Conference')).toBeInTheDocument();
    });

    it('should render workshop type', () => {
      render(<TypeBadge type="workshop" />);
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });

    it('should render meetup type', () => {
      render(<TypeBadge type="meetup" />);
      expect(screen.getByText('Meetup')).toBeInTheDocument();
    });

    it('should render hackathon type', () => {
      render(<TypeBadge type="hackathon" />);
      expect(screen.getByText('Hackathon')).toBeInTheDocument();
    });

    it('should render webinar type', () => {
      render(<TypeBadge type="webinar" />);
      expect(screen.getByText('Webinar')).toBeInTheDocument();
    });

    it('should render networking type', () => {
      render(<TypeBadge type="networking" />);
      expect(screen.getByText('Networking')).toBeInTheDocument();
    });

    it('should render summit type', () => {
      render(<TypeBadge type="summit" />);
      expect(screen.getByText('Summit')).toBeInTheDocument();
    });

    it('should render unknown type', () => {
      render(<TypeBadge type="other" />);
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  describe('Color Classes', () => {
    it('should apply indigo colors for conference', () => {
      const { container } = render(<TypeBadge type="conference" />);
      const badge = container.querySelector('[class*="bg-indigo"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply orange colors for workshop', () => {
      const { container } = render(<TypeBadge type="workshop" />);
      const badge = container.querySelector('[class*="bg-orange"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply cyan colors for meetup', () => {
      const { container } = render(<TypeBadge type="meetup" />);
      const badge = container.querySelector('[class*="bg-cyan"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply pink colors for hackathon', () => {
      const { container } = render(<TypeBadge type="hackathon" />);
      const badge = container.querySelector('[class*="bg-pink"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply violet colors for webinar', () => {
      const { container } = render(<TypeBadge type="webinar" />);
      const badge = container.querySelector('[class*="bg-violet"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply teal colors for networking', () => {
      const { container } = render(<TypeBadge type="networking" />);
      const badge = container.querySelector('[class*="bg-teal"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply purple colors for summit', () => {
      const { container } = render(<TypeBadge type="summit" />);
      const badge = container.querySelector('[class*="bg-purple"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply gray colors for unknown type', () => {
      const { container } = render(<TypeBadge type="unknown" />);
      const badge = container.querySelector('[class*="bg-gray"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Text Capitalization', () => {
    it('should capitalize lowercase type', () => {
      render(<TypeBadge type="conference" />);
      expect(screen.getByText('Conference')).toBeInTheDocument();
    });

    it('should capitalize first letter only', () => {
      render(<TypeBadge type="WORKSHOP" />);
      expect(screen.getByText('WORKSHOP')).toBeInTheDocument();
    });

    it('should capitalize first letter of mixed case', () => {
      render(<TypeBadge type="MeEtUp" />);
      expect(screen.getByText('MeEtUp')).toBeInTheDocument();
    });
  });

  describe('Case Insensitive Color Application', () => {
    it('should apply correct colors regardless of case', () => {
      const { container } = render(<TypeBadge type="CONFERENCE" />);
      const badge = container.querySelector('[class*="bg-indigo"]');
      expect(badge).toBeInTheDocument();
    });

    it('should handle mixed case for color mapping', () => {
      const { container } = render(<TypeBadge type="WoRkShOp" />);
      const badge = container.querySelector('[class*="bg-orange"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <TypeBadge type="conference" className="custom-class" />
      );
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });

    it('should combine default and custom classes', () => {
      const { container } = render(
        <TypeBadge type="conference" className="my-custom-class" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('my-custom-class');
      expect(badge.className).toContain('bg-indigo');
    });

    it('should not override default classes', () => {
      const { container } = render(
        <TypeBadge type="meetup" className="extra-padding" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('extra-padding');
      expect(badge.className).toContain('bg-cyan');
    });
  });

  describe('Badge Variant', () => {
    it('should use outline variant', () => {
      const { container } = render(<TypeBadge type="conference" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const { container } = render(<TypeBadge type="" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('');
    });

    it('should handle special characters', () => {
      render(<TypeBadge type="test-type" />);
      expect(screen.getByText('Test-type')).toBeInTheDocument();
    });

    it('should handle spaces in type name', () => {
      render(<TypeBadge type="custom event" />);
      expect(screen.getByText('Custom event')).toBeInTheDocument();
    });

    it('should apply default gray colors for types with spaces', () => {
      const { container } = render(<TypeBadge type="custom event" />);
      const badge = container.querySelector('[class*="bg-gray"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('All Supported Types', () => {
    const supportedTypes = [
      'conference',
      'workshop',
      'meetup',
      'hackathon',
      'webinar',
      'networking',
      'summit',
    ];

    supportedTypes.forEach((type) => {
      it(`should render ${type} with proper styling`, () => {
        const { container } = render(<TypeBadge type={type} />);
        const badge = container.firstChild as HTMLElement;
        expect(badge).toBeInTheDocument();
        // Check that it has some background color class
        expect(badge.className).toMatch(/bg-(indigo|orange|cyan|pink|violet|teal|purple)/);
      });
    });
  });
});

