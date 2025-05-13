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
          const userInfo = getUserInfo();
          if (userInfo) {
            // Ensure all required properties are present
            setUser({
              id: userInfo.id || '',
              username: userInfo.username || '',
              email: userInfo.email || '',
              name: userInfo.name || '',
              roles: userInfo.roles || []
            });
          }
        } else {
          // Handle the case where Keycloak is available but the user is not authenticated
          console.log('User not authenticated');
          setUser(null);
        }
      } catch (error) {
        // This should not happen now that initKeycloak always resolves
        console.error('Failed to initialize auth:', error);
        setAuthenticated(false);
        setUser(null);
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
      const userInfo = getUserInfo();
      if (userInfo) {
        setUser({
          id: userInfo.id || '',
          username: userInfo.username || '',
          email: userInfo.email || '',
          name: userInfo.name || '',
          roles: userInfo.roles || []
        });
      }
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