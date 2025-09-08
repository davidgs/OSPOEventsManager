import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify";

// Safe string conversion utility
export function safeToString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

// Safe toLowerCase utility
export function safeToLowerCase(value: any): string {
  return safeToString(value).toLowerCase();
}

// Safe charAt utility
export function safeCharAt(value: any, index: number): string {
  const str = safeToString(value);
  return str.charAt(index);
}

// Safe string manipulation utilities
export function safeCapitalize(value: any): string {
  const str = safeToString(value);
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return 'Invalid date';
  }
}

// XSS Protection utilities
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';

  return text
    .replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return char;
      }
    });
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  try {
    const urlObj = new URL(url);
    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (typeof text !== 'string') return '';

  const sanitized = sanitizeText(text);
  if (sanitized.length <= maxLength) return sanitized;

  return sanitized.substring(0, maxLength) + '...';
}

// Safe content rendering for user-generated content
export function renderSafeContent(content: string, allowHtml: boolean = false): string {
  if (typeof content !== 'string') return '';

  if (allowHtml) {
    return sanitizeHtml(content);
  }

  return sanitizeText(content);
}