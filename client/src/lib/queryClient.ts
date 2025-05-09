import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  urlOrMethod: string,
  methodOrData?: string | unknown,
  data?: unknown
): Promise<T> {
  let url: string;
  let method: string = "GET";
  let bodyData: unknown | undefined;

  // Handle different calling patterns:
  // 1. apiRequest<T>(url) - GET request
  // 2. apiRequest<T>(url, data) - GET request with query params or body
  // 3. apiRequest<T>(url, method, data) - Specific HTTP method with data

  if (urlOrMethod.startsWith("/")) {
    // First argument is URL (starts with /)
    url = urlOrMethod;
    
    if (typeof methodOrData === "string" && !methodOrData.startsWith("/")) {
      // Second argument is HTTP method
      method = methodOrData;
      bodyData = data;
    } else {
      // Second argument is data
      method = "GET";
      bodyData = methodOrData;
    }
  } else {
    // First argument might be method, second is URL
    method = urlOrMethod;
    url = methodOrData as string;
    bodyData = data;
  }

  const res = await fetch(url, {
    method,
    headers: bodyData ? { "Content-Type": "application/json" } : {},
    body: bodyData ? JSON.stringify(bodyData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
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
