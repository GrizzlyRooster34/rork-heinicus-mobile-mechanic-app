import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '@/types/auth';
import { MechanicVerificationStatus } from '@/types/service';
import { trpcClient } from '@/lib/trpc';
import { devMode, isDevCredentials, getDevUser } from '@/utils/dev';
import { withAsyncErrorHandling, withErrorHandling, logStoreAction } from './store-utils';

interface AuthStore extends AuthState {
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: 'customer' | 'mechanic') => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUserRole: (userId: string, role: 'customer' | 'mechanic' | 'admin') => Promise<boolean>;
  getAllUsers: () => User[];
  token: string | null;
  refreshToken: string | null;
  
  // Verification status
  verificationStatus: MechanicVerificationStatus | null;
  setVerificationStatus: (status: MechanicVerificationStatus | null) => void;
}

// Local dev-only users for UI fallback.
const LOCAL_DEV_USERS = {
  admin: {
    id: 'admin-cody',
    email: 'admin@example.com',
    firstName: 'Cody',
    lastName: 'Owner',
    role: 'admin' as const,
    phone: '(555) 987-6543',
    createdAt: new Date(),
  },
  mechanic: {
    id: 'mechanic-cody',
    email: 'mechanic@example.com',
    firstName: 'Cody',
    lastName: 'Mechanic',
    role: 'mechanic' as const,
    phone: '(555) 987-6543',
    createdAt: new Date(),
  }
};

// Store for registered customers in local fallback mode.
let registeredCustomers: User[] = [
  // Demo customer for testing
  {
    id: 'customer-demo',
    email: 'customer@example.com',
    firstName: 'Demo',
    lastName: 'Customer',
    role: 'customer',
    phone: '(555) 123-4567',
    createdAt: new Date(),
  }
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      verificationStatus: null,

      signup: async (email: string, password: string, firstName: string, lastName: string, phone?: string, role: 'customer' | 'mechanic' = 'customer') => {
        set({ isLoading: true });
        
        try {
          // Use TRPC client for signup
          const backendRole = role.toUpperCase() as 'CUSTOMER' | 'MECHANIC';
          const result = await trpcClient.auth.signup.mutate({
            email,
            password,
            firstName,
            lastName,
            phone,
            role: backendRole,
          });
          
          if (result.success && 'user' in result && result.user) {
            console.log('Signup successful via TRPC:', { 
              userId: result.user.id, 
              email: result.user.email,
              role: result.user.role,
              timestamp: new Date().toISOString() 
            });
            
            // Use the user object as returned from the backend
            const completeUser: User = {
              ...result.user,
              role: result.user.role as 'customer' | 'mechanic' | 'admin',
              createdAt: new Date(result.user.createdAt)
            };
            
            // Auto-login after successful signup
            set({ 
              user: completeUser,
              token: 'token' in result ? result.token || null : null,
              isAuthenticated: true, 
              isLoading: false,
              token: result.token ?? null,
              refreshToken: result.refreshToken ?? null
            });
            
            return true;
          } else {
            console.log('Signup failed via TRPC:', 'error' in result ? result.error : 'Unknown error');
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Signup error:', error);
          
          // Enhanced error logging for debugging
          if (error instanceof Error) {
            console.error('Signup error details:', {
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
            
            // Check if it's a JSON parse error (HTML response)
            if (error.message.includes('JSON') || error.message.includes('HTML')) {
              console.error('Possible tRPC server connection issue. Check if backend is running.');
            }
          }
          
          set({ isLoading: false });
          return false;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Check for dev credentials first
          if (devMode && isDevCredentials(email, password)) {
            const devUser = getDevUser(email);
            if (devUser) {
              console.log('Dev login successful:', { 
                userId: devUser.id, 
                role: devUser.role, 
                timestamp: new Date().toISOString() 
              });
              
              set({ 
                user: devUser, 
                isAuthenticated: true, 
                isLoading: false 
              });
              
              return true;
            }
          }
          
          // Try TRPC client for login, but fallback to dev mode if it fails
          try {
            const result = await trpcClient.auth.signin.mutate({
              email,
              password,
            });
            
            if (result.success && 'user' in result && result.user) {
              console.log('Login successful via TRPC:', { 
                userId: result.user.id, 
                role: result.user.role, 
                timestamp: new Date().toISOString() 
              });
              
              // Use the user object as returned from the backend
              const completeUser: User = {
                ...result.user,
                role: result.user.role as 'customer' | 'mechanic' | 'admin',
                createdAt: new Date(result.user.createdAt)
              };
              
              set({ 
                user: completeUser,
                token: 'token' in result ? result.token || null : null,
                isAuthenticated: true, 
                isLoading: false,
                token: result.token ?? null,
                refreshToken: result.refreshToken ?? null
              });
              
              return true;
            } else {
              console.log('Login failed via TRPC:', 'error' in result ? result.error : 'Unknown error');
            }
          } catch (trpcError) {
            console.warn('TRPC login failed, trying dev fallback:', trpcError);
            
            // Fallback to dev credentials if TRPC fails
            if (devMode && isDevCredentials(email, password)) {
              const devUser = getDevUser(email);
              if (devUser) {
                console.log('Fallback dev login successful:', { 
                  userId: devUser.id, 
                  role: devUser.role, 
                  timestamp: new Date().toISOString() 
                });
                
                set({ 
                  user: devUser, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
                
                return true;
              }
            }
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        const currentUser = get().user;
        
        // Production logging
        console.log('User logout:', { 
          userId: currentUser?.id, 
          role: currentUser?.role,
          environment: 'production',
          timestamp: new Date().toISOString() 
        });
        clearAuthTokens();
        
        set({ 
          user: null,
          token: null,
          isAuthenticated: false 
        });
      },

      setUser: (user: User) => {
        // Production logging
        console.log('User set:', { 
          userId: user.id, 
          role: user.role, 
          environment: 'production',
          timestamp: new Date().toISOString() 
        });
        
        set({ 
          user, 
          isAuthenticated: true 
        });
      },

      updateUserRole: async (userId: string, role: 'customer' | 'mechanic' | 'admin') => {
        const currentUser = get().user;
        
        // Only admin can update roles
        if (currentUser?.role !== 'admin') {
          console.warn('Unauthorized role update attempt:', { 
            currentUserId: currentUser?.id,
            currentUserRole: currentUser?.role,
            targetUserId: userId,
            targetRole: role,
            timestamp: new Date().toISOString() 
          });
          return false;
        }

        try {
          const backendRole = role.toUpperCase() as 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
          const result = await trpcClient.admin.updateUserRole.mutate({
            userId,
            role: backendRole,
          });
          
          if (result.success) {
            console.log('User role updated via TRPC:', { 
              userId, 
              newRole: role,
              updatedBy: currentUser.id,
              timestamp: new Date().toISOString() 
            });
            
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Role update error:', error);
          return false;
        }
      },

      getAllUsers: () => {
        const currentUser = get().user;
        
        // Only admin can view all users
        if (currentUser?.role !== 'admin') {
          console.warn('Unauthorized user list access attempt:', { 
            userId: currentUser?.id,
            role: currentUser?.role,
            timestamp: new Date().toISOString() 
          });
          return [];
        }

        if (!devMode) {
          return [];
        }

        return [
          LOCAL_DEV_USERS.admin,
          LOCAL_DEV_USERS.mechanic,
          ...registeredCustomers
        ];
      },

      setVerificationStatus: (status: MechanicVerificationStatus | null) => {
        set({ verificationStatus: status });
      },
    }),
    {
      name: 'heinicus-auth-storage',
      storage: createJSONStorage(() => AsyncStorage, {
        // Add error handling to prevent crashes if AsyncStorage fails
        replacer: (key, value) => {
          try {
            return value;
          } catch (error) {
            console.warn('AsyncStorage serialization error for key:', key, error);
            return null;
          }
        },
        reviver: (key, value) => {
          try {
            return value;
          } catch (error) {
            console.warn('AsyncStorage deserialization error for key:', key, error);
            return null;
          }
        },
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
        verificationStatus: state.verificationStatus,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth store hydration failed:', error);
          // Don't crash the app - just log the error and continue with default state
        } else {
          console.log('✅ Auth store hydrated successfully');
        }
      },
    }
  )
);
