import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  initKeycloak, 
  isAuthenticated, 
  getUserInfo, 
  login as keycloakLogin, 
  logout as keycloakLogout 
} from '@/lib/keycloak';

// Define the shape of our user info
interface UserInfo {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  roles: string[];
}

// Define the shape of our auth context
interface AuthContextType {
  initialized: boolean;
  authenticated: boolean;
  user: UserInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  initialized: false,
  authenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  hasRole: () => false,
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Initialize Keycloak on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing Keycloak...');
        const authenticated = await initKeycloak();
        
        setAuthenticated(authenticated);
        
        if (authenticated) {
          const userInfo = getUserInfo();
          setUser(userInfo);
        }
        
        setInitialized(true);
        console.log('Keycloak initialization complete');
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Handler for login
  const login = async (): Promise<void> => {
    try {
      await keycloakLogin();
      // Login will redirect, so we don't update state here
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Handler for logout
  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      setAuthenticated(false);
      await keycloakLogout();
      // Logout will redirect, so we don't update state further
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  // Check if user has a specific role
  const hasRole = (role: string): boolean => {
    if (!authenticated || !user || !user.roles) {
      return false;
    }
    return user.roles.includes(role);
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        initialized,
        authenticated,
        user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for accessing the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Higher-order component to protect routes
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  roles: string[] = []
) {
  return function AuthProtectedComponent(props: P) {
    const { initialized, authenticated, hasRole } = useAuth();

    if (!initialized) {
      // Show loading spinner while Keycloak initializes
      return <div>Loading...</div>;
    }

    if (!authenticated) {
      // Redirect to login page if not authenticated
      keycloakLogin();
      return <div>Redirecting to login...</div>;
    }

    // Check roles if specified
    if (roles.length > 0 && !roles.some(role => hasRole(role))) {
      return <div>You don't have permission to access this page.</div>;
    }

    // Render the protected component
    return <Component {...props} />;
  };
}