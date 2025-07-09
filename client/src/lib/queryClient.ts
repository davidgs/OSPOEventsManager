import { QueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from './keycloak';

// Options for apiRequest
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiRequestOptions = {
  headers?: Record<string, string>;
  body?: any;
};

// API request helper (moved before defaultQueryFn to avoid circular dependency)
export async function apiRequest(
  method: Method,
  path: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<Response> {
  // Determine if we should include auth headers
  const authHeaders = getAuthHeaders();

  // Prepare headers - don't set Content-Type for FormData
  const headers = {
    ...authHeaders,
    ...options.headers,
  };

  // Only set Content-Type to application/json if data is not FormData
  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  // Add body for non-GET requests
  if (method !== 'GET' && data) {
    if (data instanceof FormData) {
      requestOptions.body = data;
    } else {
      requestOptions.body = JSON.stringify(data);
    }
  }

  // Make the request
  return fetch(path, requestOptions);
}

// Default query function for all queries with authentication
const defaultQueryFn = async ({ queryKey }: any) => {
  const [url, params] = queryKey;
  let finalUrl = url;

  // Add query parameters if they exist
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    finalUrl = `${url}?${searchParams.toString()}`;
  }

  // Use apiRequest instead of plain fetch to include auth headers
  const response = await apiRequest('GET', finalUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
};

// Create a client with default query function
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create a default query function with proper typing
export function getQueryFn(options: { on401?: 'throw' | 'returnNull' } = {}) {
  return async function defaultQueryFn({ queryKey }: any) {
    const path = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    const response = await apiRequest('GET', path);

    if (response.status === 401 && options.on401 === 'returnNull') {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }

    return response.json();
  };
}