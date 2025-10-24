interface KeycloakUser {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified: boolean;
  attributes?: Record<string, string[]>;
  requiredActions?: string[];
  id?: string;
  createdTimestamp?: number;
  lastLogin?: number;
}

interface KeycloakAdminConfig {
  serverUrl: string;
  realm: string;
  adminUsername: string;
  adminPassword: string;
  clientId: string;
}

export class KeycloakAdminService {
  private config: KeycloakAdminConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      serverUrl: process.env.KEYCLOAK_SERVER_URL || 'https://keycloak-dev-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com/auth',
      realm: process.env.KEYCLOAK_REALM || 'ospo-events',
      adminUsername: process.env.KEYCLOAK_ADMIN || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'ospo-events-app'
    };
  }

  /**
   * Get admin access token for Keycloak Admin API
   */
  private async getAdminToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const tokenUrl = `${this.config.serverUrl}/realms/master/protocol/openid-connect/token`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.config.adminUsername,
          password: this.config.adminPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get admin token: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json() as any;
      this.accessToken = tokenData.access_token;
      // Set expiry to 90% of actual expiry to be safe
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 900);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Keycloak admin token:', error);
      throw error;
    }
  }

  /**
   * Create a new user in Keycloak
   */
  async createUser(userData: {
    email: string;
    name: string;
    role?: string;
  }): Promise<{ userId: string; temporaryPassword: string }> {
    try {
      const token = await this.getAdminToken();
      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Generate a temporary password
      const temporaryPassword = this.generateTemporaryPassword();

      const keycloakUser: KeycloakUser = {
        username: userData.email,
        email: userData.email,
        firstName: firstName || '',
        lastName: lastName || '',
        enabled: true,
        emailVerified: false,
        attributes: {
          role: userData.role ? [userData.role] : ['attendee'],
        },
        requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
      };

      const createUserUrl = `${this.config.serverUrl}/admin/realms/${this.config.realm}/users`;

      const response = await fetch(createUserUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keycloakUser),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create user: ${response.status} - ${errorText}`);
      }

      // Get the user ID from the Location header
      const locationHeader = response.headers.get('location');
      if (!locationHeader) {
        throw new Error('User created but no location header returned');
      }

      const userId = locationHeader.split('/').pop();
      if (!userId) {
        throw new Error('Could not extract user ID from location header');
      }

      // Set temporary password
      await this.setUserPassword(userId, temporaryPassword, true);

      // Send email actions (verification + password reset)
      await this.sendEmailActions(userId, ['UPDATE_PASSWORD', 'VERIFY_EMAIL']);

      return { userId, temporaryPassword };
    } catch (error) {
      console.error('Error creating Keycloak user:', error);
      throw error;
    }
  }

  /**
   * Set user password
   */
  private async setUserPassword(userId: string, password: string, temporary: boolean = true): Promise<void> {
    try {
      const token = await this.getAdminToken();
      const setPasswordUrl = `${this.config.serverUrl}/admin/realms/${this.config.realm}/users/${userId}/reset-password`;

      const response = await fetch(setPasswordUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          value: password,
          temporary: temporary,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set user password: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error setting user password:', error);
      throw error;
    }
  }

  /**
   * Send required action emails
   */
  private async sendEmailActions(userId: string, actions: string[]): Promise<void> {
    try {
      const token = await this.getAdminToken();
      const sendEmailUrl = `${this.config.serverUrl}/admin/realms/${this.config.realm}/users/${userId}/execute-actions-email`;

      const response = await fetch(sendEmailUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actions),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Failed to send email actions: ${response.status} - ${errorText}`);
        // Don't throw error here as user creation was successful
      }
    } catch (error) {
      console.error('Error sending email actions:', error);
      // Don't throw error here as user creation was successful
    }
  }

  /**
   * Check if user exists by email
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const token = await this.getAdminToken();
      const searchUrl = `${this.config.serverUrl}/admin/realms/${this.config.realm}/users?email=${encodeURIComponent(email)}`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search for user: ${response.status} - ${errorText}`);
      }

      const users = await response.json() as any[];
      return users.length > 0;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false; // Assume user doesn't exist if we can't check
    }
  }

  /**
   * Get all users from Keycloak
   */
  async getAllUsers(): Promise<KeycloakUser[]> {
    try {
      const token = await this.getAdminToken();
      const usersUrl = `${this.config.serverUrl}/admin/realms/${this.config.realm}/users`;

      const response = await fetch(usersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }

      const users = await response.json() as any[];

      // Transform the response to match our KeycloakUser interface
      return users.map(user => ({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        enabled: user.enabled || false,
        emailVerified: user.emailVerified || false,
        attributes: user.attributes || {},
        requiredActions: user.requiredActions || [],
        id: user.id,
        createdTimestamp: user.createdTimestamp,
        lastLogin: user.lastLogin
      }));
    } catch (error) {
      console.error('Error fetching users from Keycloak:', error);
      throw error;
    }
  }

  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

export const keycloakAdminService = new KeycloakAdminService();