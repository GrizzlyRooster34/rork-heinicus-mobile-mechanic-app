import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/backend/trpc/app-router";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getAuthToken } from "@/lib/auth-token";

// @ts-expect-error Package resolution can load incompatible internal tRPC types despite matching public versions.
export const trpc = createTRPCReact<AppRouter>();

const readExpoHost = () => {
  const expoHost =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost ||
    null;

  if (!expoHost) {
    return null;
  }

  const host = expoHost.split(":")[0];
  return host || null;
};

const getBaseUrl = () => {
  // Check for Rork environment first
  if (typeof window !== 'undefined' && window.location) {
    const currentUrl = window.location.origin;
    console.log('Using current origin for API:', currentUrl);
    return currentUrl;
  }

  const envBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  // Production API URL
  if (envBaseUrl) {
    console.log('Using configured API URL:', envBaseUrl);
    return envBaseUrl;
  }

  // Development fallback with platform-specific URLs
  if (__DEV__) {
    const expoHost = readExpoHost();
    if (expoHost) {
      const deviceUrl = `http://${expoHost}:3000`;
      console.log('Using Expo host API URL:', deviceUrl);
      return deviceUrl;
    }

    const devUrl = Platform.select({
      web: 'http://localhost:3000',
      android: 'http://10.0.2.2:3000',
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
