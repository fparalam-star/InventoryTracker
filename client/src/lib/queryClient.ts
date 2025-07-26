import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get current user info from localStorage if available
  const currentUser = localStorage.getItem('currentUser');
  let userId = null;
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      userId = user.id;
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (userId) {
    headers["x-user-id"] = userId.toString();
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get current user info from localStorage if available
    const currentUser = localStorage.getItem('currentUser');
    let userId = null;
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        userId = user.id;
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const headers: Record<string, string> = {};
    if (userId) {
      headers["x-user-id"] = userId.toString();
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
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
