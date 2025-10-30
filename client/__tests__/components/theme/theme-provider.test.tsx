import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '@/components/theme/theme-provider';

describe('ThemeProvider', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  const matchMediaMock = (matches: boolean = false) => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query) => matchMediaMock(false)),
      writable: true,
      configurable: true,
    });

    localStorageMock.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should use system theme by default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });
      expect(result.current.theme).toBe('system');
    });

    it('should use custom default theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });
      expect(result.current.theme).toBe('dark');
    });

    it('should load theme from localStorage', () => {
      localStorageMock.setItem('ospo-ui-theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should use custom storage key', () => {
      localStorageMock.setItem('custom-key', 'light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider storageKey="custom-key">{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should switch to dark theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should save theme to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock.getItem('ospo-ui-theme')).toBe('dark');
    });

    it('should set data-theme attribute', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should remove previous theme class', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('System Theme', () => {
    it('should resolve system theme to light when media query does not match', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should apply system theme class to document', () => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      // Since matchMedia is mocked to return false, system theme resolves to light
      expect(
        document.documentElement.classList.contains('light') ||
        document.documentElement.classList.contains('dark')
      ).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Storage error');
          },
          setItem: () => {
            throw new Error('Storage error');
          },
        },
        writable: true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to save theme to localStorage');

      consoleWarnSpy.mockRestore();
    });

    it('should fall back to default theme on storage read error', () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Storage error');
          },
          setItem: () => {},
        },
        writable: true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('useTheme Hook', () => {
    it('should work with default initial state when used outside ThemeProvider', () => {
      // The context has an initial state, so it returns default values
      // rather than throwing an error
      const { result } = renderHook(() => useTheme());

      // Should have the initial state values
      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('resolvedTheme');

      // setTheme will be a no-op function from initialState
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('should provide theme value', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('resolvedTheme');
    });

    it('should have callable setTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(typeof result.current.setTheme).toBe('function');
    });
  });
});

