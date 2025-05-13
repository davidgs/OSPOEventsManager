import { QueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from './keycloak';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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

// Options for apiRequest
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiRequestOptions = {
  headers?: Record<string, string>;
  body?: any;
};

// API request helper
export async function apiRequest(
  method: Method, 
  path: string, 
  data?: any,
  options: ApiRequestOptions = {}
): Promise<Response> {
  // Determine if we should include auth headers
  const authHeaders = getAuthHeaders();
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers,
  };
  
  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && data) {
    requestOptions.body = JSON.stringify(data);
  }
  
  // Make the request
  return fetch(path, requestOptions);
}