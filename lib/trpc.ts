import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Check for disabled API (standalone mode)
  if (process.env.EXPO_PUBLIC_API_URL === 'disabled' || 
      process.env.EXPO_PUBLIC_BASE_URL === 'disabled') {
    return null; // Offline mode
  }

  // Check for Rork environment first
  if (typeof window !== 'undefined' && window.location) {
    const currentUrl = window.location.origin;
    return currentUrl;
  }

  // Production API URL
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Development fallback with platform-specific URLs
  if (__DEV__) {
    const devUrl = Platform.select({
      web: 'http://localhost:3000',
      default: 'http://10.0.2.2:3000', // Android emulator
    });
    return devUrl;
  }

  // No server available - use offline mode
  return null;
};

// Create offline-capable tRPC client
const createTRPCClient = () => {
  const baseUrl = getBaseUrl();
  
  if (!baseUrl) {
    // Offline mode - return a mock client that doesn't make network requests
    return trpc.createClient({
      links: [
        httpLink({
          url: 'http://offline-mode',
          fetch: () => {
            // Return mock responses for offline mode
            return Promise.resolve(new Response(JSON.stringify({
              result: { data: null }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        })
      ]
    });
  }

  return trpc.createClient({
    links: [
      httpLink({
        url: `${baseUrl}/api/trpc`,
      // transformer: superjson, // Remove transformer for now to avoid tRPC error
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
  };

export const trpcClient = createTRPCClient();