import Keycloak from 'keycloak-js';

// Determine the Keycloak URL based on the environment
const getKeycloakUrl = () => {
  // First, check if there's an environment variable set
  const envUrl = import.meta.env.VITE_KEYCLOAK_URL;
  if (envUrl) {
    // Handle relative URLs by appending to origin
    if (envUrl.startsWith('/')) {
      const fullUrl = window.location.origin + envUrl;
      console.log('Using relative Keycloak URL:', fullUrl);
      return fullUrl;
    }
    
    console.log('Using configured Keycloak URL:', envUrl);
    return envUrl;
  }
  
  // Default to /auth path on same origin 
  const defaultUrl = window.location.origin + '/auth';
  console.log('Using default Keycloak URL:', defaultUrl);
  return defaultUrl;
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
        pkceMethod: 'S256',
        checkLoginIframeInterval: 5
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
    
    // Use callback route for redirect
    const redirectUri = window.location.origin + '/callback';
    console.log('Using redirect URI:', redirectUri);
    
    try {
      keycloak.login({
        redirectUri: redirectUri,
        loginHint: ''
      })
      .then(() => {
        console.log('Login initiated successfully');
        resolve();
      })
      .catch((error) => {
        console.error('Login failed:', error);
        
        // Try direct redirect as fallback with explicit realm
        try {
          const baseUrl = (keycloak.authServerUrl || getKeycloakUrl()).replace(/\/+$/, '');
          const authUrl = `${baseUrl}/realms/ospo-events/protocol/openid-connect/auth`;
          const clientId = keycloak.clientId;
          const encodedRedirectUri = encodeURIComponent(redirectUri);
          
          console.log('Direct auth URL:', authUrl);
          window.location.href = `${authUrl}?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=openid`;
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
 * Register using Keycloak
 * @returns Promise with the registration result
 */
export const register = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Initiating registration process...');
    
    // Get the current URL with port included
    const currentUrl = window.location.href.split('?')[0].split('#')[0];
    console.log('Using redirect URI for registration:', currentUrl);
    
    try {
      keycloak.register({
        redirectUri: currentUrl,
      })
      .then(() => {
        console.log('Registration initiated successfully');
        resolve();
      })
      .catch((error) => {
        console.error('Registration failed:', error);
        
        // Try direct redirect as fallback
        try {
          const authUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/registrations`;
          const clientId = keycloak.clientId;
          const redirectUri = encodeURIComponent(currentUrl);
          
          window.location.href = `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
          resolve(); // This will resolve but page will redirect
        } catch (err) {
          console.error('Fallback registration also failed:', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      reject(error);
    }
  });
};

/**
 * Logout using Keycloak
 * @returns Promise with the logout result
 */
export const logout = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Initiating logout process...');
      
      // Clear any local session/storage data first
      sessionStorage.removeItem('keycloak-token');
      localStorage.removeItem('keycloak-token');
      
      // Attempt to logout with Keycloak
      keycloak.logout({
        redirectUri: window.location.origin
      })
      .then(() => {
        console.log('Logout initiated successfully');
        resolve();
      })
      .catch((error) => {
        console.error('Logout failed:', error);
        
        // Fallback - direct redirect to logout endpoint
        try {
          const logoutUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/logout`;
          const redirectUri = encodeURIComponent(window.location.origin);
          
          window.location.href = `${logoutUrl}?redirect_uri=${redirectUri}`;
          resolve(); // This will resolve but page will redirect
        } catch (err) {
          console.error('Fallback logout also failed:', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      // Try to recover by reloading the page
      window.location.reload();
      resolve();
    }
  });
};

/**
 * Check if the user is authenticated
 * @returns Boolean indicating authentication status
 */
export const isAuthenticated = (): boolean => {
  return !!keycloak.authenticated && !!keycloak.token;
};

/**
 * Get user information from Keycloak
 * @returns User information object or null if not authenticated
 */
export const getUserInfo = () => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return null;
  }
  
  try {
    const token = keycloak.tokenParsed;
    
    return {
      id: token.sub || '',
      username: token.preferred_username || '',
      email: token.email || '',
      firstName: token.given_name || '',
      lastName: token.family_name || '',
      name: token.name || token.preferred_username || '',
      roles: token.realm_access?.roles || [],
    };
  } catch (error) {
    console.error('Error parsing user info from token:', error);
    return null;
  }
};

/**
 * Get the authorization headers with bearer token
 * @returns Headers object with Authorization header
 */
export const getAuthHeaders = (): Record<string, string> => {
  if (!keycloak.authenticated || !keycloak.token) {
    console.warn('Attempted to get auth headers when not authenticated');
    return {};
  }
  
  return {
    'Authorization': `Bearer ${keycloak.token}`
  };
};

/**
 * Add authorization headers to fetch options
 * @param options Fetch options object
 * @returns Fetch options with authorization headers
 */
export const withAuth = (options: RequestInit = {}): RequestInit => {
  if (!keycloak.authenticated) {
    return options;
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders()
    }
  };
};

/**
 * Check if user has the specified role
 * @param role Role to check
 * @returns Boolean indicating if user has the role
 */
export const hasRole = (role: string): boolean => {
  if (!keycloak.authenticated) {
    return false;
  }
  
  try {
    return keycloak.hasRealmRole(role);
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

// Export the keycloak instance for advanced usage
export default keycloak;