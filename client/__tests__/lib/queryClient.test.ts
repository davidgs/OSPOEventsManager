import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { queryClient, apiRequest, getQueryFn, reset401Handling } from '@/lib/queryClient';

// Mock keycloak module
vi.mock('@/lib/keycloak', () => ({
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer mock-token' })),
}));

// Mock auth-context module
vi.mock('@/contexts/auth-context', () => ({
  logout: vi.fn(),
}));

describe('queryClient', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    vi.clearAllMocks();
    reset401Handling(); // Reset 401 handling flag between tests
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('apiRequest', () => {
    it('should make GET request with auth headers', async () => {
      const mockResponse = { ok: true, json: async () => ({ data: 'test' }) };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await apiRequest('GET', '/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should make POST request with JSON body', async () => {
      const mockResponse = { ok: true, json: async () => ({ data: 'test' }) };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const data = { name: 'Test' };
      await apiRequest('POST', '/api/test', data);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should make PUT request with JSON body', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const data = { id: 1, name: 'Updated' };
      await apiRequest('PUT', '/api/test/1', data);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      );
    });

    it('should make DELETE request', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await apiRequest('DELETE', '/api/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should make PATCH request with JSON body', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const data = { status: 'active' };
      await apiRequest('PATCH', '/api/test/1', data);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      );
    });

    it('should handle FormData without setting Content-Type', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.append('file', 'test');

      await apiRequest('POST', '/api/upload', formData);

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.body).toBe(formData);
      // Content-Type should not be set for FormData (browser sets it with boundary)
      expect(callArgs.headers['Content-Type']).toBeUndefined();
    });

    it('should merge custom headers', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await apiRequest('GET', '/api/test', undefined, {
        headers: { 'X-Custom-Header': 'value' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'value',
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should handle 401 response and redirect to login', async () => {
      const mockResponse = { ok: false, status: 401 };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Mock window.location.replace
      const mockReplace = vi.fn();
      Object.defineProperty(window, 'location', {
        value: {
          replace: mockReplace,
        },
        writable: true,
      });

      await apiRequest('GET', '/api/test');

      // Give time for async redirect to be called
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should not trigger multiple 401 redirects', async () => {
      const mockResponse = { ok: false, status: 401 };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Mock window.location.replace
      const mockReplace = vi.fn();
      Object.defineProperty(window, 'location', {
        value: {
          replace: mockReplace,
        },
        writable: true,
      });

      // Make multiple requests
      await Promise.all([
        apiRequest('GET', '/api/test1'),
        apiRequest('GET', '/api/test2'),
        apiRequest('GET', '/api/test3'),
      ]);

      // Give time for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Redirect should only be called once due to isHandling401 flag
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    it('should return response for successful request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const response = await apiRequest('GET', '/api/test');

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it('should return response for non-401 error', async () => {
      const mockResponse = { ok: false, status: 404 };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const response = await apiRequest('GET', '/api/test');

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should not include body for GET requests', async () => {
      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await apiRequest('GET', '/api/test', { should: 'be ignored' });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe('getQueryFn', () => {
    it('should create query function that fetches data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const queryFn = getQueryFn();
      const result = await queryFn({ queryKey: ['/api/test'] });

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle 401 with returnNull option', async () => {
      const mockResponse = { ok: false, status: 401 };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const queryFn = getQueryFn({ on401: 'returnNull' });
      const result = await queryFn({ queryKey: ['/api/test'] });

      expect(result).toBeNull();
    });

    it('should throw error for non-OK response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const queryFn = getQueryFn();

      await expect(
        queryFn({ queryKey: ['/api/test'] })
      ).rejects.toThrow('API error: 404');
    });

    it('should handle string queryKey', async () => {
      const mockData = { data: 'test' };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const queryFn = getQueryFn();
      const result = await queryFn({ queryKey: '/api/test' });

      expect(result).toEqual(mockData);
    });

    it('should handle array queryKey', async () => {
      const mockData = { data: 'test' };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const queryFn = getQueryFn();
      const result = await queryFn({ queryKey: ['/api/test', { id: 1 }] });

      expect(result).toEqual(mockData);
    });
  });

  describe('queryClient instance', () => {
    it('should be configured with default options', () => {
      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('should have default query function', () => {
      expect(queryClient.getDefaultOptions().queries?.queryFn).toBeDefined();
      expect(typeof queryClient.getDefaultOptions().queries?.queryFn).toBe('function');
    });
  });

  describe('default query function', () => {
    it('should fetch data with query parameters', async () => {
      const mockData = { results: [] };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const defaultQueryFn = queryClient.getDefaultOptions().queries?.queryFn;
      if (!defaultQueryFn) throw new Error('No default query function');

      const result = await defaultQueryFn({
        queryKey: ['/api/test', { page: 1, limit: 10 }],
      } as any);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });

    it('should skip undefined and null parameters', async () => {
      const mockData = { results: [] };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const defaultQueryFn = queryClient.getDefaultOptions().queries?.queryFn;
      if (!defaultQueryFn) throw new Error('No default query function');

      await defaultQueryFn({
        queryKey: ['/api/test', { page: 1, search: undefined, filter: null }],
      } as any);

      const calledUrl = (global.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).not.toContain('search=');
      expect(calledUrl).not.toContain('filter=');
    });

    it('should throw error for failed fetch', async () => {
      const mockResponse = { ok: false, status: 500 };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const defaultQueryFn = queryClient.getDefaultOptions().queries?.queryFn;
      if (!defaultQueryFn) throw new Error('No default query function');

      await expect(
        defaultQueryFn({ queryKey: ['/api/test'] } as any)
      ).rejects.toThrow('Failed to fetch /api/test: 500');
    });

    it('should handle string queryKey in default function', async () => {
      const mockData = { data: 'test' };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const defaultQueryFn = queryClient.getDefaultOptions().queries?.queryFn;
      if (!defaultQueryFn) throw new Error('No default query function');

      const result = await defaultQueryFn({ queryKey: '/api/test' } as any);

      expect(result).toEqual(mockData);
    });
  });
});

