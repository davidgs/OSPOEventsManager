import Keycloak from 'keycloak-js';

// Determine the Keycloak URL based on the environment
const getKeycloakUrl = () => {
  // Check for Replit environment
  const isReplitEnv = window.location.hostname.includes('replit.app') || 
                      window.location.hostname.includes('replit.dev');
  
  if (isReplitEnv) {
    // For Replit, we use the same hostname but on port 8080
    return window.location.protocol + '//' + window.location.hostname.replace('.replit.dev', '-8080.replit.dev');
  } else if (window.location.hostname === 'localhost') {
    // Local development
    return 'http://localhost:8080';
  } else {
    // Production environment assumes Keycloak is at /auth
    return window.location.origin + '/auth';
  }
};

// Create Keycloak instance with dynamic URL
const keycloak = new Keycloak({
  url: getKeycloakUrl(),
  realm: 'ospo-events',
  clientId: 'ospo-events-app',
});

// Log the Keycloak configuration for debugging
console.log('Keycloak configuration:', {
  url: getKeycloakUrl(),
  realm: 'ospo-events',
  clientId: 'ospo-events-app'
});

/**
 * Initialize Keycloak and handle authentication
 * @returns Promise with the authentication result
 */
export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('Initializing Keycloak...');
    
    // Simple initialization with minimal options
    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false,
        enableLogging: true,
        pkceMethod: 'S256'
      })
      .then((authenticated) => {
        console.log('Keycloak initialized successfully. Authenticated:', authenticated);
        if (authenticated) {
          setupTokenRefresh();
        }
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Failed to initialize Keycloak:', error);
        // Continue without authentication
        resolve(false);
      });
  });
};

/**
 * Setup token refresh mechanism
 */
const setupTokenRefresh = () => {
  if (!keycloak.authenticated) return;
  
  // Setup token refresh
  const updateInterval = (keycloak.tokenParsed?.exp ?? 0) - (keycloak.tokenParsed?.iat ?? 0);
  const refreshBuffer = Math.max(updateInterval * 0.75, 60); // At least 1 minute before expiry
  
  console.log(`Setting up token refresh. Token valid for ${updateInterval}s, will refresh after ${refreshBuffer}s`);
  
  // Set up a timer for token refresh
  keycloak.onTokenExpired = () => {
    console.log('Token expired, attempting to refresh');
    refreshToken();
  };
  
  // Also set up a regular interval refresh as a backup
  setInterval(() => {
    if (keycloak.authenticated) {
      refreshToken();
    }
  }, refreshBuffer * 1000);
};

/**
 * Refresh the token
 */
const refreshToken = () => {
  keycloak.updateToken(30)
    .then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed successfully');
      }
    })
    .catch(() => {
      console.error('Failed to refresh token, logging out');
      keycloak.logout();
    });
};

/**
 * Login using Keycloak
 * @returns Promise with the login result
 */
export const login = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Initiating login process...');
    
    try {
      keycloak.login({
        redirectUri: window.location.origin,
      })
      .then(() => {
        console.log('Login initiated successfully');
        resolve();
      })
      .catch((error) => {
        console.error('Login failed:', error);
        
        // Try direct redirect as fallback
        try {
          const authUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/auth`;
          const clientId = keycloak.clientId;
          const redirectUri = encodeURIComponent(window.location.origin);
          
          window.location.href = `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
          resolve(); // This will resolve but page will redirect
        } catch (err) {
          console.error('Fallback login also failed:', err);
          reject(err);
        }
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