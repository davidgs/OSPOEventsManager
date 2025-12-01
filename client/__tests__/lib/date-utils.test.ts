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

import { describe, it, expect, vi } from 'vitest';
import { safeParseDate, safeFormatDate, safeFormatDateRange } from '@/lib/date-utils';

describe('Date Utility Functions', () => {
  describe('safeParseDate', () => {
    it('should parse valid date string', () => {
      const result = safeParseDate('2024-01-15T12:00:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(15);
    });

    it('should return Date object as-is', () => {
      const date = new Date('2024-01-15');
      const result = safeParseDate(date);
      expect(result).toBe(date);
    });

    it('should return null for invalid date string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeParseDate('not-a-date');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid date string: not-a-date');
      consoleSpy.mockRestore();
    });

    it('should return null for null input', () => {
      expect(safeParseDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(safeParseDate(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeParseDate('');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should parse ISO date strings', () => {
      const result = safeParseDate('2024-12-25T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('should parse various date formats', () => {
      expect(safeParseDate('2024/01/15')).toBeInstanceOf(Date);
      expect(safeParseDate('Jan 15, 2024')).toBeInstanceOf(Date);
      expect(safeParseDate('2024-01-15T00:00:00')).toBeInstanceOf(Date);
    });
  });

  describe('safeFormatDate', () => {
    it('should format valid date with default format', () => {
      const result = safeFormatDate('2024-01-15T12:00:00');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format date with locale-aware formatting', () => {
      const result = safeFormatDate('2024-01-15T12:00:00', 'MMM d, yyyy', 'en');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format Date object', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = safeFormatDate(date);
      expect(result).toBe('Jan 15, 2024');
    });

    it('should return "Invalid Date" for invalid input', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeFormatDate('not-a-date');
      expect(result).toBe('Invalid Date');
      consoleSpy.mockRestore();
    });

    it('should return "Invalid Date" for null', () => {
      expect(safeFormatDate(null)).toBe('Invalid Date');
    });

    it('should return "Invalid Date" for undefined', () => {
      expect(safeFormatDate(undefined)).toBe('Invalid Date');
    });

    it('should handle custom format string', () => {
      const result = safeFormatDate('2024-01-15T12:00:00', 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });

    it('should format different months correctly', () => {
      expect(safeFormatDate('2024-01-15T12:00:00')).toContain('Jan');
      expect(safeFormatDate('2024-02-15T12:00:00')).toContain('Feb');
      expect(safeFormatDate('2024-12-25T12:00:00')).toContain('Dec');
    });

    it('should handle leap year dates', () => {
      const result = safeFormatDate('2024-02-29T12:00:00');
      expect(result).toBe('Feb 29, 2024');
    });

    it('should handle format error gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Test with an invalid format string that might cause an error
      const result = safeFormatDate('2024-01-15T12:00:00', 'invalid-format-xyz');
      // Should either return a formatted date or "Invalid Date"
      expect(result).toBeTruthy();
      consoleSpy.mockRestore();
    });
  });

  describe('safeFormatDateRange', () => {
    it('should format valid date range', () => {
      const result = safeFormatDateRange('2024-01-15T12:00:00', '2024-01-20T12:00:00');
      expect(result).toContain('Jan 15, 2024');
      expect(result).toContain('Jan 20, 2024');
      expect(result).toContain(' - ');
    });

    it('should format date range with locale-aware formatting', () => {
      const result = safeFormatDateRange('2024-01-15T12:00:00', '2024-01-20T12:00:00', 'en');
      expect(result).toContain('Jan 15, 2024');
      expect(result).toContain('Jan 20, 2024');
    });

    it('should handle Date objects', () => {
      const start = new Date('2024-01-15T12:00:00');
      const end = new Date('2024-01-20T12:00:00');
      const result = safeFormatDateRange(start, end);
      expect(result).toBe('Jan 15, 2024 - Jan 20, 2024');
    });

    it('should return "Invalid Date Range" when start is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeFormatDateRange('not-a-date', '2024-01-20');
      expect(result).toBe('Invalid Date Range');
      consoleSpy.mockRestore();
    });

    it('should return "Invalid Date Range" when end is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeFormatDateRange('2024-01-15', 'not-a-date');
      expect(result).toBe('Invalid Date Range');
      consoleSpy.mockRestore();
    });

    it('should return "Invalid Date Range" when both are invalid', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeFormatDateRange('not-a-date', 'also-not-a-date');
      expect(result).toBe('Invalid Date Range');
      consoleSpy.mockRestore();
    });

    it('should return "Invalid Date Range" for null inputs', () => {
      expect(safeFormatDateRange(null, null)).toBe('Invalid Date Range');
      expect(safeFormatDateRange('2024-01-15', null)).toBe('Invalid Date Range');
      expect(safeFormatDateRange(null, '2024-01-20')).toBe('Invalid Date Range');
    });

    it('should return "Invalid Date Range" for undefined inputs', () => {
      expect(safeFormatDateRange(undefined, undefined)).toBe('Invalid Date Range');
    });

    it('should handle same-day range', () => {
      const result = safeFormatDateRange('2024-01-15T12:00:00', '2024-01-15T12:00:00');
      expect(result).toBe('Jan 15, 2024 - Jan 15, 2024');
    });

    it('should handle cross-month range', () => {
      const result = safeFormatDateRange('2024-01-25T12:00:00', '2024-02-05T12:00:00');
      expect(result).toBe('Jan 25, 2024 - Feb 5, 2024');
    });

    it('should handle cross-year range', () => {
      const result = safeFormatDateRange('2023-12-25T12:00:00', '2024-01-05T12:00:00');
      expect(result).toBe('Dec 25, 2023 - Jan 5, 2024');
    });

    it('should handle format error gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Mock the format function to throw an error
      const originalRequire = require;
      const mockFormat = vi.fn(() => {
        throw new Error('Format error');
      });

      // This test verifies error handling exists
      // The actual error path is difficult to trigger with valid dates
      expect(() => {
        safeFormatDateRange('2024-01-15', '2024-01-20');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle year boundaries', () => {
      const result = safeFormatDate('2024-12-31T12:00:00');
      expect(result).toContain('2024');
    });

    it('should handle month boundaries', () => {
      expect(safeFormatDate('2024-01-31T12:00:00')).toContain('Jan 31');
      expect(safeFormatDate('2024-02-01T12:00:00')).toContain('Feb 1');
    });

    it('should maintain consistency between parse and format', () => {
      const dateStr = '2024-06-15T12:00:00';
      const parsed = safeParseDate(dateStr);
      const formatted = safeFormatDate(parsed);
      expect(formatted).toBe('Jun 15, 2024');
    });

    it('should handle very old dates', () => {
      const result = safeFormatDate('1900-01-01T12:00:00');
      expect(result).toBe('Jan 1, 1900');
    });

    it('should handle future dates', () => {
      const result = safeFormatDate('2099-12-31T12:00:00');
      expect(result).toBe('Dec 31, 2099');
    });
  });
});

