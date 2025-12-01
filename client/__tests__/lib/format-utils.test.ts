/* The MIT License (MIT)
 *
 * Copyright (c) 2025-present David G. Simmons
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
import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  useFormattedDate,
  useFormattedNumber,
  useFormattedCurrency,
} from '@/lib/format-utils';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

describe('Format Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFormattedDate', () => {
    it('should format date with default format', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedDate());
      const date = new Date('2024-01-15T12:00:00');
      const formatted = result.current.formatDate(date);

      expect(formatted).toContain('2024');
      expect(formatted).toContain('Jan');
    });

    it('should format date with custom format', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedDate());
      const date = new Date('2024-01-15T12:00:00');
      const formatted = result.current.formatDate(date, 'yyyy-MM-dd');

      expect(formatted).toBe('2024-01-15');
    });

    it('should format date string', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedDate());
      const formatted = result.current.formatDate('2024-01-15T12:00:00');

      expect(formatted).toContain('2024');
    });

    it('should format distance', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedDate());
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const formatted = result.current.formatDistance(pastDate);

      expect(formatted).toContain('5');
    });

    it('should format relative date', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedDate());
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formatted = result.current.formatRelative(tomorrow);

      expect(formatted).toBeTruthy();
    });
  });

  describe('useFormattedNumber', () => {
    it('should format number', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedNumber());
      const formatted = result.current.formatNumber(1234.56);

      expect(formatted).toBe('1,234.56');
    });

    it('should format integer', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedNumber());
      const formatted = result.current.formatInteger(1234.56);

      expect(formatted).toBe('1,235');
    });

    it('should format decimal', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedNumber());
      const formatted = result.current.formatDecimal(1234.567, 2, 2);

      expect(formatted).toBe('1,234.57');
    });

    it('should format percent', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedNumber());
      const formatted = result.current.formatPercent(50, 0);

      expect(formatted).toBe('50%');
    });
  });

  describe('useFormattedCurrency', () => {
    it('should format USD currency', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedCurrency());
      const formatted = result.current.formatUSD(1234.56);

      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });

    it('should format EUR currency', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedCurrency());
      const formatted = result.current.formatEUR(1234.56);

      expect(formatted).toContain('€');
      expect(formatted).toContain('1,234.56');
    });

    it('should format currency with custom currency', () => {
      (useTranslation as any).mockReturnValue({
        i18n: {
          language: 'en',
        },
      });

      const { result } = renderHook(() => useFormattedCurrency());
      const formatted = result.current.formatCurrency(1234.56, 'GBP');

      expect(formatted).toContain('1,234.56');
    });
  });
});

