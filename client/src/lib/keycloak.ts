import Keycloak from 'keycloak-js';

// Initialize Keycloak instance
const keycloak = new Keycloak({
  url: 'http://localhost:8080/auth',
  realm: 'ospo-events',
  clientId: 'ospo-events-app',
});

/**
 * Initialize Keycloak and handle authentication
 * @returns Promise with the authentication result
 */
export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false,
        enableLogging: true,
      })
      .then((authenticated) => {
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
  return keycloak.login();
};

/**
 * Logout using Keycloak
 * @returns Promise with the logout result
 */
export const logout = (): Promise<void> => {
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
      id: keycloak.tokenParsed.sub,
      username: keycloak.tokenParsed.preferred_username,
      email: keycloak.tokenParsed.email,
      name: keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username,
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