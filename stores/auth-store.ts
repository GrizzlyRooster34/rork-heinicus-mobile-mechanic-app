import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '@/types/auth';
import { MechanicVerificationStatus } from '@/types/service';
import { trpcClient } from '@/lib/trpc';
import { devMode, isDevCredentials, getDevUser } from '@/utils/dev';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: 'customer' | 'mechanic') => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUserRole: (userId: string, role: 'customer' | 'mechanic' | 'admin') => Promise<boolean>;
  getAllUsers: () => User[];
  
  // Verification status
  verificationStatus: MechanicVerificationStatus | null;
  setVerificationStatus: (status: MechanicVerificationStatus | null) => void;
}

// Production configuration - Admin and Mechanic users
const PRODUCTION_USERS = {
  admin: {
    id: 'admin-cody',
    email: 'matthew.heinen.2014@gmail.com',
    firstName: 'Cody',
    lastName: 'Owner',
    role: 'admin' as const,
    phone: '(555) 987-6543',
    createdAt: new Date(),
  },
  mechanic: {
    id: 'mechanic-cody',
    email: 'cody@heinicus.com',
    firstName: 'Cody',
    lastName: 'Mechanic',
    role: 'mechanic' as const,
    phone: '(555) 987-6543',
    createdAt: new Date(),
  }
};

// Store for registered customers (in production, this would be in a database)
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
      isLoading: false,
      isAuthenticated: false,
      verificationStatus: null,

      signup: async (email: string, password: string, firstName: string, lastName: string, phone?: string, role: 'customer' | 'mechanic' = 'customer') => {
        set({ isLoading: true });
        
        try {
          // Use TRPC client for signup
          const result = await trpcClient.auth.signup.mutate({
            email,
            password,
            firstName,
            lastName,
            phone,
            role,
          });
          
          if (result.success && result.user) {
            console.log('Signup successful via TRPC:', { 
              userId: result.user.id, 
              email: result.user.email,
              role: result.user.role,
              timestamp: new Date().toISOString() 
            });
            
            // Use the user object as returned from the backend
            const completeUser: User = result.user;
            
            // Auto-login after successful signup
            set({ 
              user: completeUser, 
              isAuthenticated: true, 
              isLoading: false 
            });
            
            return true;
          } else {
            console.log('Signup failed via TRPC:', result.error);
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
            
            if (result.success && result.user) {
              console.log('Login successful via TRPC:', { 
                userId: result.user.id, 
                role: result.user.role, 
                timestamp: new Date().toISOString() 
              });
              
              // Use the user object as returned from the backend
              const completeUser: User = result.user;
              
              set({ 
                user: completeUser, 
                isAuthenticated: true, 
                isLoading: false 
              });
              
              return true;
            } else {
              console.log('Login failed via TRPC:', result.error);
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
        
        set({ 
          user: null, 
          isAuthenticated: false,
          verificationStatus: null,
        });
      },

      setUser: (user: User) => {
        // Production security: Validate user role
        if (user.role === 'mechanic' && user.id !== 'mechanic-cody') {
          console.warn('Unauthorized mechanic access attempt:', { 
            userId: user.id, 
            environment: 'production',
            timestamp: new Date().toISOString() 
          });
          return;
        }
        
        if (user.role === 'admin' && user.id !== 'admin-cody') {
          console.warn('Unauthorized admin access attempt:', { 
            userId: user.id, 
            environment: 'production',
            timestamp: new Date().toISOString() 
          });
          return;
        }
        
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
          const result = await trpcClient.admin.updateUserRole.mutate({
            userId,
            role,
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

        return [
          PRODUCTION_USERS.admin,
          PRODUCTION_USERS.mechanic,
          ...registeredCustomers
        ];
      },

      setVerificationStatus: (status: MechanicVerificationStatus | null) => {
        set({ verificationStatus: status });
      },
    }),
    {
      name: 'heinicus-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        verificationStatus: state.verificationStatus,
      }),
    }
  )
);