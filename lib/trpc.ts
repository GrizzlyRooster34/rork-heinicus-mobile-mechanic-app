import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/backend/trpc/app-router";
import { getAuthToken } from "@/lib/auth-token";
import { getApiBaseUrl } from "@/lib/api-base-url";

// @ts-expect-error Package resolution can load incompatible internal tRPC types despite matching public versions.
export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getApiBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const token = getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else if (process.env.EXPO_PUBLIC_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`;
        }

        headers['X-Environment'] = __DEV__ ? 'development' : 'production';

        return headers;
      },
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, options);
          
          // Check if response is HTML (likely a 404 or error page)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            const urlString = typeof url === 'string' ? url : url.toString();
            console.error('Received HTML response instead of JSON:', {
              contentType,
              status: response.status,
              statusText: response.statusText,
              url: urlString
            });

            throw new Error(`Server returned HTML instead of JSON. Check if tRPC server is running at ${urlString}`);
          }
          
          return response;
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('tRPC fetch error:', {
              url: typeof url === 'string' ? url : url.toString(),
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
          } else {
            console.error('tRPC fetch error (unknown type):', {
              url: typeof url === 'string' ? url : url.toString(),
              error: String(error),
              timestamp: new Date().toISOString()
            });
          }

          throw error;
        }
      },
    }),
  ],
});
