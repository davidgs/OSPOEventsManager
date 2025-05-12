import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initKeycloak, isAuthenticated, login, logout, getUserInfo } from '@/lib/keycloak';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    roles: string[];
  } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    // Initialize Keycloak on component mount
    const initAuth = async () => {
      try {
        const isAuth = await initKeycloak();
        setAuthenticated(isAuth);
        
        if (isAuth) {
          setUser(getUserInfo());
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Refresh auth state function
  const refreshAuthState = () => {
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    
    if (authStatus) {
      setUser(getUserInfo());
    } else {
      setUser(null);
    }
  };

  // Login handler
  const handleLogin = async () => {
    await login();
    refreshAuthState();
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated: authenticated,
    isLoading: loading,
    user,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};