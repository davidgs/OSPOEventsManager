import Keycloak from 'keycloak-js';

// Initialize Keycloak instance
const keycloak = new Keycloak({
  url: 'http://localhost:8080/auth',
  realm: 'ospo-events',
  clientId: 'ospo-events-app',
});

/**
 * Check if we are in development mode
 */
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
};

/**
 * Initialize Keycloak and handle authentication
 * @returns Promise with the authentication result
 */
export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // In development mode, we can bypass Keycloak authentication
    if (isDevelopmentMode()) {
      console.log('Development mode detected, using mock authentication');
      // Create a mock Keycloak token for development
      keycloak.authenticated = true;
      keycloak.token = 'mock-dev-token';
      keycloak.tokenParsed = {
        sub: 'dev-user-id',
        preferred_username: 'developer',
        email: 'developer@example.com',
        name: 'Developer User',
        realm_access: {
          roles: ['user']
        }
      };
      
      // Resolve with authenticated status
      setTimeout(() => resolve(true), 500);
      return;
    }
    
    // Normal Keycloak authentication for production
    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false,
        enableLogging: true,
        flow: 'standard',
        pkceMethod: 'S256',
        timeSkew: 0,
        responseMode: 'fragment',
      })
      .then((authenticated) => {
        // Set up automatic token refresh
        refreshTokenSetup(keycloak);
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization error:', error);
        
        // In development, let's auto-resolve with a fake auth to avoid breaking the app
        if (isDevelopmentMode()) {
          console.log('Recovering in development mode with mock authentication');
          keycloak.authenticated = true;
          keycloak.token = 'mock-dev-token';
          keycloak.tokenParsed = {
            sub: 'dev-user-id',
            preferred_username: 'developer',
            email: 'developer@example.com',
            name: 'Developer User',
            realm_access: {
              roles: ['user']
            }
          };
          resolve(true);
        } else {
          reject(error);
        }
      });
  });
};

/**
 * Setup token refresh mechanism
 * @param keycloak The Keycloak instance
 */
const refreshTokenSetup = (keycloak: Keycloak) => {
  // Don't set up refresh for development mode
  if (isDevelopmentMode()) {
    return;
  }
  
  // Set up a timer for 70% of token lifespan
  keycloak.onTokenExpired = () => {
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
      .catch(() => {
        console.error('Failed to refresh token');
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
  if (isDevelopmentMode()) {
    console.log('Development mode: Simulating login');
    return new Promise((resolve) => {
      // Set authenticated state
      keycloak.authenticated = true;
      keycloak.token = 'mock-dev-token';
      keycloak.tokenParsed = {
        sub: 'dev-user-id',
        preferred_username: 'developer',
        email: 'developer@example.com',
        name: 'Developer User',
        realm_access: {
          roles: ['user']
        }
      };
      setTimeout(resolve, 500);
    });
  }
  return keycloak.login();
};

/**
 * Logout using Keycloak
 * @returns Promise with the logout result
 */
export const logout = (): Promise<void> => {
  if (isDevelopmentMode()) {
    console.log('Development mode: Simulating logout');
    return new Promise((resolve) => {
      // Clear authenticated state
      keycloak.authenticated = false;
      keycloak.token = undefined;
      keycloak.tokenParsed = undefined;
      setTimeout(resolve, 500);
    });
  }
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