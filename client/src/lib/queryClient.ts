import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Safely parse JSON from text, return an empty object if it fails
function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("Failed to parse JSON:", e);
    return {};
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      // Try to parse as JSON first in case the server returned a structured error
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonError = await res.json();
        errorText = JSON.stringify(jsonError);
        console.error("Server JSON error:", jsonError);
      } else {
        errorText = await res.text();
        console.error("Server error response text:", errorText);
      }
    } catch (e) {
      // If we can't parse it as JSON or get the text, fall back to status text
      errorText = res.statusText;
      console.error("Failed to parse error response:", e);
    }
    
    // Throw an enhanced error with more details
    throw new Error(`${res.status} ${res.statusText}: ${errorText || 'No additional error details'}`);
  }
}

// Safe version of response.json() that handles errors
async function safeJsonResponse<T>(response: Response): Promise<T> {
  try {
    // Try to use the native json() method
    return await response.json() as T;
  } catch (e) {
    console.warn("Native json() method failed, falling back to text() + parse", e);
    
    try {
      // Fallback to getting text and parsing manually
      const text = await response.text();
      
      // If the response is empty, return an empty object
      if (!text || text.trim() === '') {
        console.log("Empty response, returning empty object");
        return {} as T;
      }
      
      // Parse the text as JSON
      return safeParseJSON(text) as T;
    } catch (textError) {
      console.error("Failed to get response text, returning empty object", textError);
      return {} as T;
    }
  }
}

export async function apiRequest<TData = any>(
  method: string,
  url: string,
  body?: any,
  options: RequestInit = {}
): Promise<TData> {
  const { headers = {}, ...rest } = options;
  
  // Debug: Log the request method and URL
  console.log(`Making ${method} request to ${url}`);
  if (body) console.log('Request body:', body);
  
  try {
    // Only add Content-Type for JSON data, not for FormData
    const isFormData = body instanceof FormData;
    const requestHeaders = isFormData
      ? { ...headers } // FormData sets its own Content-Type with boundary
      : { "Content-Type": "application/json", ...headers };
    
    const requestBody = body instanceof FormData 
      ? body 
      : body 
        ? JSON.stringify(body) 
        : undefined;
    
    // Debug: Log the stringified request body
    if (requestBody && !isFormData) {
      console.log('Stringified request body:', requestBody);
    }
    
    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials: "include",
      ...rest,
    });

    console.log(`Response status for ${method} ${url}:`, res.status);
    console.log(`Response content-type for ${method} ${url}:`, res.headers.get('content-type'));

    await throwIfResNotOk(res);
    
    // Use our safe JSON parsing function that handles errors
    const data = await safeJsonResponse<TData>(res);
    console.log(`Successfully processed response from ${method} ${url}`);
    return data;
  } catch (error) {
    console.error(`Error in apiRequest for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <TData>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<TData> => {
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Making GET request to ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      console.log(`Response status for GET ${url}:`, res.status);
      console.log(`Response content-type for GET ${url}:`, res.headers.get('content-type'));

      if (options.on401 === "returnNull" && res.status === 401) {
        return null as unknown as TData;
      }

      await throwIfResNotOk(res);
      
      // Use our safe JSON parsing function that handles errors
      const data = await safeJsonResponse<TData>(res);
      console.log(`Successfully processed response from GET ${url}`);
      return data;
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn<unknown>({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
