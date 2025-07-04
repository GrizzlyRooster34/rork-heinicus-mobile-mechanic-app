export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'mechanic' | 'admin';
  phone?: string;
  createdAt: Date;
  isActive?: boolean; // Make optional to avoid backend compatibility issues
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'customer' | 'mechanic';
}