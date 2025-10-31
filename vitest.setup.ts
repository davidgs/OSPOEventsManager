import '@testing-library/jest-dom/vitest';
import { afterAll, vi } from 'vitest';

// Only mock browser APIs if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  // Mock window.matchMedia for tests that use responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
      return [];
    }
    unobserve() { }
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
  } as any;
}

// Ensure cleanup after all tests
afterAll(async () => {
  // Clear toast timeouts if available
  try {
    const { clearAllToastTimeouts } = await import('./client/src/hooks/use-toast');
    clearAllToastTimeouts();
  } catch (e) {
    // Ignore import errors in setup
  }

  // Clear any pending timers
  if (typeof global !== 'undefined') {
    // Use fake timers to clear all pending timers if available
    if (vi.isFakeTimers && vi.isFakeTimers()) {
      vi.clearAllTimers();
    }
  }

  // Small delay to ensure async cleanup completes
  await new Promise(resolve => setTimeout(resolve, 100));
});

