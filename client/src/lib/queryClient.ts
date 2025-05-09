import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any,
  options: RequestInit = {}
): Promise<T> {
  const { headers = {}, ...rest } = options;
  
  // Debug: Log the request method and URL
  console.log(`Making ${method} request to ${url}`);
  console.log('Request body:', body);
  
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
  
  // Check if response is empty (204 No Content)
  if (res.status === 204) {
    return {} as T;
  }
  
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
