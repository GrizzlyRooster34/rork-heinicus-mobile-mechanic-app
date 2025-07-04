import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check for Rork environment first
  if (typeof window !== 'undefined' && window.location) {
    const currentUrl = window.location.origin;
    console.log('Using current origin for API:', currentUrl);
    return currentUrl;
  }

  // Production API URL
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('Using production API URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Development fallback with platform-specific URLs
  if (__DEV__) {
    const devUrl = Platform.select({
      web: 'http://localhost:3000',
      default: 'http://localhost:3000',
    });
    console.log('Using development API URL:', devUrl);
    return devUrl;
  }

  // Final fallback
  console.warn('No base URL configured, using localhost');
  return 'http://localhost:3000';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (process.env.EXPO_PUBLIC_API_KEY) {
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
            console.error('Received HTML response instead of JSON:', {
              url,
              status: response.status,
              statusText: response.statusText,
              contentType
            });
            
            // Return a mock response for development to prevent crashes
            if (__DEV__) {
              return new Response(JSON.stringify({ 
                error: { 
                  message: 'tRPC server not available - using dev fallback',
                  code: 'INTERNAL_SERVER_ERROR' 
                } 
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            throw new Error(`Server returned HTML instead of JSON. Check if tRPC server is running at ${url}`);
          }
          
          return response;
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('tRPC fetch error:', {
              url,
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
          } else {
            console.error('tRPC fetch error (unknown type):', {
              url,
              error: String(error),
              timestamp: new Date().toISOString()
            });
          }
          
          // In development, return a fallback response instead of crashing
          if (__DEV__) {
            return new Response(JSON.stringify({ 
              error: { 
                message: 'Network error - using dev fallback',
                code: 'INTERNAL_SERVER_ERROR' 
              } 
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          throw error;
        }
      },
    }),
  ],
});