import Keycloak from 'keycloak-js';

// Create Keycloak instance
const keycloak = new Keycloak({
  url: 'http://localhost:8080/',  // Will be overridden by the keycloak.json config
  realm: 'ospo-events',
  clientId: 'ospo-events-app',
});

/**
 * Check if we are in development mode
 */
const isDevelopmentMode = () => {
  // Consider Replit as development environment
  const isReplitEnv = window.location.hostname.includes('replit.app') || 
                      window.location.hostname.includes('replit.dev');
  const isDev = window.location.hostname === 'localhost' || isReplitEnv;
  
  console.log('Environment check - development mode:', isDev);
  return isDev;
};

/**
 * Initialize Keycloak and handle authentication
 * @returns Promise with the authentication result
 */
export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Initialize Keycloak with the appropriate configuration
    
    keycloak
      .init({
        onLoad: 'check-sso', // Just check and don't force login
        enableLogging: true,
        checkLoginIframe: false, // Completely disable iframe checks
        silentCheckSsoFallback: false,
        pkceMethod: 'S256',
        timeSkew: 60, // Allow for more clock skew
        responseMode: 'fragment',
        adapter: 'default'
      })
      .then((authenticated) => {
        console.log('Keycloak initialization complete. Authenticated:', authenticated);
        // Set up automatic token refresh
        refreshTokenSetup(keycloak);
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization error:', error);
        // Don't fail the app if Keycloak is not available - just continue as unauthenticated
        console.warn('Continuing without authentication due to Keycloak initialization failure');
        resolve(false); // Resolve with false instead of rejecting to allow the app to continue
      });
  });
};

/**
 * Setup token refresh mechanism
 * @param keycloak The Keycloak instance
 */
const refreshTokenSetup = (keycloak: Keycloak) => {
  console.log('Setting up token refresh mechanism');
  
  // Set up a timer for token refresh
  keycloak.onTokenExpired = () => {
    console.log('Token expired, attempting to refresh');
    keycloak
      .updateToken(30) // Refresh token if it has less than 30 seconds left
      .then((refreshed) => {
        if (refreshed) {
          console.log('Token refreshed successfully');
        } else {
          console.log('Token not refreshed, valid for ' + 
            Math.round(keycloak.tokenParsed!.exp! - Date.now() / 1000) + ' seconds');
        }
      })
      .catch((error) => {
        console.error('Failed to refresh token:', error);
        // Force logout if refresh fails
        keycloak.logout();
      });
  };
};

/**
 * Login using Keycloak
 * @returns Promise with the login result
 */
export const login = (): Promise<void> => {
  console.log('Initiating Keycloak login');
  return new Promise((resolve, reject) => {
    try {
      // Use a direct login approach with fewer options to minimize failures
      const loginOptions = {
        redirectUri: window.location.origin + '/',
        prompt: 'login',
        maxAge: 900, // 15 minutes
        scope: 'openid profile email'
      };
      
      keycloak.login(loginOptions).then(() => {
        console.log('Login initiated successfully');
        resolve();
      }).catch((error: any) => {
        console.error('Keycloak login error:', error);
        // Try a more direct approach as fallback
        window.location.href = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/auth?client_id=${keycloak.clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=openid`;
        
        // We don't reject here because we're using the fallback redirect
        resolve();
      });
    } catch (error) {
      console.error('Unexpected error during login:', error);
      reject(error);
    }
  });
};

/**
 * Logout using Keycloak
 * @returns Promise with the logout result
 */
export const logout = (): Promise<void> => {
  console.log('Initiating Keycloak logout');
  return keycloak.logout({ redirectUri: window.location.origin });
};

/**
 * Check if the user is authenticated
 * @returns Boolean indicating authentication status
 */
export const isAuthenticated = (): boolean => {
  return !!keycloak.authenticated;
};

/**
 * Get user information from Keycloak
 * @returns User information object
 */
export const getUserInfo = () => {
  if (keycloak.tokenParsed) {
    return {
      id: keycloak.tokenParsed.sub || '',
      username: keycloak.tokenParsed.preferred_username || '',
      email: keycloak.tokenParsed.email || '',
      name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username || '',
      roles: keycloak.tokenParsed.realm_access?.roles || [],
    };
  }
  return null;
};

/**
 * Get the authorization headers with bearer token
 * @returns Headers object with Authorization header
 */
export const getAuthHeaders = (): Record<string, string> => {
  return {
    Authorization: `Bearer ${keycloak.token}`,
  };
};

/**
 * Check if user has the specified role
 * @param role Role to check
 * @returns Boolean indicating if user has the role
 */
export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role);
};

// Export the keycloak instance for advanced usage
export default keycloak;