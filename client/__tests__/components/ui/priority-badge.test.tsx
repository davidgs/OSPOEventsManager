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
import { PriorityBadge } from '@/components/ui/priority-badge';

describe('PriorityBadge', () => {
  describe('Priority Rendering', () => {
    it('should render essential priority', () => {
      render(<PriorityBadge priority="essential" />);
      expect(screen.getByText('essential')).toBeInTheDocument();
    });

    it('should render high priority', () => {
      render(<PriorityBadge priority="high" />);
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should render important priority', () => {
      render(<PriorityBadge priority="important" />);
      expect(screen.getByText('important')).toBeInTheDocument();
    });

    it('should render medium priority', () => {
      render(<PriorityBadge priority="medium" />);
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should render low priority', () => {
      render(<PriorityBadge priority="low" />);
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('should render nice to have priority', () => {
      render(<PriorityBadge priority="nice to have" />);
      expect(screen.getByText('nice to have')).toBeInTheDocument();
    });

    it('should render unknown priority', () => {
      render(<PriorityBadge priority="unknown" />);
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('Color Classes', () => {
    it('should apply red colors for essential', () => {
      const { container } = render(<PriorityBadge priority="essential" />);
      const badge = container.querySelector('[class*="bg-red"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply orange colors for high', () => {
      const { container } = render(<PriorityBadge priority="high" />);
      const badge = container.querySelector('[class*="bg-orange"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply yellow colors for important', () => {
      const { container } = render(<PriorityBadge priority="important" />);
      const badge = container.querySelector('[class*="bg-yellow"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply blue colors for medium', () => {
      const { container } = render(<PriorityBadge priority="medium" />);
      const badge = container.querySelector('[class*="bg-blue"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply green colors for low', () => {
      const { container } = render(<PriorityBadge priority="low" />);
      const badge = container.querySelector('[class*="bg-green"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply emerald colors for nice to have', () => {
      const { container } = render(<PriorityBadge priority="nice to have" />);
      const badge = container.querySelector('[class*="bg-emerald"]');
      expect(badge).toBeInTheDocument();
    });

    it('should apply gray colors for unknown priority', () => {
      const { container } = render(<PriorityBadge priority="unknown" />);
      const badge = container.querySelector('[class*="bg-gray"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase priority', () => {
      render(<PriorityBadge priority="ESSENTIAL" />);
      expect(screen.getByText('ESSENTIAL')).toBeInTheDocument();
    });

    it('should handle mixed case priority', () => {
      render(<PriorityBadge priority="HiGh" />);
      expect(screen.getByText('HiGh')).toBeInTheDocument();
    });

    it('should apply correct colors regardless of case', () => {
      const { container } = render(<PriorityBadge priority="ESSENTIAL" />);
      const badge = container.querySelector('[class*="bg-red"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <PriorityBadge priority="high" className="custom-class" />
      );
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });

    it('should combine default and custom classes', () => {
      const { container } = render(
        <PriorityBadge priority="high" className="my-custom-class" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('my-custom-class');
      expect(badge.className).toContain('bg-orange');
    });
  });

  describe('Badge Variant', () => {
    it('should use outline variant', () => {
      const { container } = render(<PriorityBadge priority="medium" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const { container } = render(<PriorityBadge priority="" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('');
    });

    it('should handle null-like values gracefully', () => {
      render(<PriorityBadge priority="null" />);
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<PriorityBadge priority="test-priority" />);
      expect(screen.getByText('test-priority')).toBeInTheDocument();
    });
  });
});

