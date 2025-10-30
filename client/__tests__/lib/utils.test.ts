import { describe, it, expect } from 'vitest';
import {
  safeToString,
  safeToLowerCase,
  safeCharAt,
  safeCapitalize,
  cn,
  formatBytes,
  formatDate,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  truncateText,
  renderSafeContent,
} from '@/lib/utils';

describe('String Safety Utilities', () => {
  describe('safeToString', () => {
    it('should convert null to empty string', () => {
      expect(safeToString(null)).toBe('');
    });

    it('should convert undefined to empty string', () => {
      expect(safeToString(undefined)).toBe('');
    });

    it('should return string as-is', () => {
      expect(safeToString('hello')).toBe('hello');
    });

    it('should convert numbers to string', () => {
      expect(safeToString(123)).toBe('123');
    });

    it('should convert booleans to string', () => {
      expect(safeToString(true)).toBe('true');
      expect(safeToString(false)).toBe('false');
    });

    it('should convert objects to string', () => {
      expect(safeToString({ foo: 'bar' })).toBe('[object Object]');
    });

    it('should convert arrays to string', () => {
      expect(safeToString([1, 2, 3])).toBe('1,2,3');
    });
  });

  describe('safeToLowerCase', () => {
    it('should convert string to lowercase', () => {
      expect(safeToLowerCase('HELLO')).toBe('hello');
    });

    it('should handle null and undefined', () => {
      expect(safeToLowerCase(null)).toBe('');
      expect(safeToLowerCase(undefined)).toBe('');
    });

    it('should convert mixed case to lowercase', () => {
      expect(safeToLowerCase('HeLLo WoRLd')).toBe('hello world');
    });

    it('should handle numbers', () => {
      expect(safeToLowerCase(123)).toBe('123');
    });
  });

  describe('safeCharAt', () => {
    it('should return character at index', () => {
      expect(safeCharAt('hello', 0)).toBe('h');
      expect(safeCharAt('hello', 4)).toBe('o');
    });

    it('should return empty string for out of bounds', () => {
      expect(safeCharAt('hello', 10)).toBe('');
      expect(safeCharAt('hello', -1)).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(safeCharAt(null, 0)).toBe('');
      expect(safeCharAt(undefined, 0)).toBe('');
    });

    it('should handle numbers', () => {
      expect(safeCharAt(123, 1)).toBe('2');
    });
  });

  describe('safeCapitalize', () => {
    it('should capitalize first letter', () => {
      expect(safeCapitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(safeCapitalize('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(safeCapitalize(null)).toBe('');
      expect(safeCapitalize(undefined)).toBe('');
    });

    it('should not affect already capitalized strings', () => {
      expect(safeCapitalize('Hello')).toBe('Hello');
    });

    it('should only capitalize first letter', () => {
      expect(safeCapitalize('hELLO')).toBe('HELLO');
    });

    it('should handle single character', () => {
      expect(safeCapitalize('a')).toBe('A');
    });
  });
});

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle tailwind merge', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });
  });

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536 * 1024)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle custom decimals', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 3)).toBe('1.5 KB');
    });

    it('should handle large numbers', () => {
      expect(formatBytes(1024 ** 4)).toBe('1 TB');
      expect(formatBytes(1024 ** 5)).toBe('1 PB');
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/Jan.*15.*2024/);
    });

    it('should return "Invalid date" for invalid input', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
    });

    it('should return "Invalid date" for empty string', () => {
      expect(formatDate('')).toBe('Invalid date');
    });

    it('should handle ISO date strings', () => {
      const result = formatDate('2024-12-25T10:30:00Z');
      expect(result).toMatch(/Dec.*25.*2024/);
    });
  });
});

describe('XSS Protection Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      expect(sanitizeHtml('<b>bold</b>')).toBe('<b>bold</b>');
      expect(sanitizeHtml('<i>italic</i>')).toBe('<i>italic</i>');
      expect(sanitizeHtml('<strong>strong</strong>')).toBe('<strong>strong</strong>');
      expect(sanitizeHtml('<em>emphasis</em>')).toBe('<em>emphasis</em>');
    });

    it('should remove dangerous HTML tags', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('');
    });

    it('should remove event handlers', () => {
      const dirty = '<b onclick="alert(\'xss\')">click</b>';
      const clean = sanitizeHtml(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).toContain('click');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
      expect(sanitizeHtml(123 as any)).toBe('');
    });

    it('should remove iframe tags', () => {
      expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe('');
    });

    it('should keep content from removed tags', () => {
      const result = sanitizeHtml('<div>content</div>');
      expect(result).toContain('content');
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeText('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeText('a & b')).toBe('a &amp; b');
      expect(sanitizeText('"quotes"')).toBe('&quot;quotes&quot;');
      expect(sanitizeText("'apostrophe'")).toBe('&#x27;apostrophe&#x27;');
    });

    it('should handle non-string input', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });

    it('should escape multiple special characters', () => {
      expect(sanitizeText('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
    });

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should preserve safe text', () => {
      expect(sanitizeText('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      const url = 'http://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow https URLs', () => {
      const url = 'https://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should allow mailto URLs', () => {
      const url = 'mailto:test@example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should reject javascript URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should reject data URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should reject file URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeUrl(null as any)).toBe('');
      expect(sanitizeUrl(undefined as any)).toBe('');
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://example.com?foo=bar&baz=qux';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should handle URLs with hash', () => {
      const url = 'https://example.com#section';
      expect(sanitizeUrl(url)).toBe(url);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'a'.repeat(200);
      const result = truncateText(longText, 100);
      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      const shortText = 'hello';
      expect(truncateText(shortText, 100)).toBe('hello');
    });

    it('should handle default max length', () => {
      const text = 'a'.repeat(150);
      const result = truncateText(text);
      expect(result.length).toBeLessThanOrEqual(103);
    });

    it('should sanitize text', () => {
      const text = '<script>alert(1)</script>';
      const result = truncateText(text);
      expect(result).not.toContain('<script>');
    });

    it('should handle non-string input', () => {
      expect(truncateText(null as any)).toBe('');
      expect(truncateText(undefined as any)).toBe('');
    });

    it('should handle empty string', () => {
      expect(truncateText('')).toBe('');
    });

    it('should truncate at exact max length', () => {
      const text = 'a'.repeat(100);
      const result = truncateText(text, 100);
      expect(result).toBe(text);
    });
  });

  describe('renderSafeContent', () => {
    it('should sanitize text by default', () => {
      const content = '<script>alert(1)</script>';
      const result = renderSafeContent(content);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should sanitize HTML when allowHtml is true', () => {
      const content = '<b>bold</b><script>alert(1)</script>';
      const result = renderSafeContent(content, true);
      expect(result).toContain('<b>bold</b>');
      expect(result).not.toContain('<script>');
    });

    it('should handle non-string input', () => {
      expect(renderSafeContent(null as any)).toBe('');
      expect(renderSafeContent(undefined as any)).toBe('');
    });

    it('should preserve safe content', () => {
      const content = 'Hello World';
      expect(renderSafeContent(content)).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(renderSafeContent('')).toBe('');
    });
  });
});

