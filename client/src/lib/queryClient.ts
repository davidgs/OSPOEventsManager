import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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

    await throwIfResNotOk(res);
    
    // Always try to parse as JSON first, fallback if it fails
    try {
      // Check the content type before trying to parse JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json() as TData;
      }
      
      // For non-JSON or empty responses, return an empty object
      console.warn(`Response from ${url} is not JSON or is empty`);
      return {} as TData;
    } catch (parseError) {
      console.warn(`Failed to parse response from ${url}:`, parseError);
      // Return empty object on parse errors
      return {} as TData;
    }
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

      if (options.on401 === "returnNull" && res.status === 401) {
        return null as unknown as TData;
      }

      await throwIfResNotOk(res);
      
      try {
        // Make sure we can parse the response
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json() as TData;
        } else {
          console.warn(`Response from ${url} is not JSON or is empty`);
          return {} as TData;
        }
      } catch (parseError) {
        console.warn(`Failed to parse response from ${url}:`, parseError);
        // Return empty object on parse errors
        return {} as TData;
      }
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
