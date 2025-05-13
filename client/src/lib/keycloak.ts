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
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false, // Disable iframe to avoid timeout issues
        enableLogging: true,
        flow: 'standard',
        pkceMethod: 'S256',
        timeSkew: 0,
        responseMode: 'fragment',
      })
      .then((authenticated) => {
        console.log('Keycloak initialization complete. Authenticated:', authenticated);
        // Set up automatic token refresh
        refreshTokenSetup(keycloak);
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization error:', error);
        reject(error);
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
  return keycloak.login();
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