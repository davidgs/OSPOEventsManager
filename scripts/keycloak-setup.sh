#!/bin/bash

# Start Keycloak server
start_keycloak() {
  echo "Starting Keycloak server..."
  
  # Running Keycloak in development mode with default admin user
  keycloak start-dev --http-port=8080 \
    --db-url-host=localhost \
    --db-username=$PGUSER \
    --db-password=$PGPASSWORD \
    --db-url-database=$PGDATABASE \
    --features=preview
}

# Create a new realm
create_realm() {
  echo "Creating OSPO Events realm..."
  
  # Create a realm configuration JSON
  cat > /tmp/ospo-realm.json << EOF
{
  "realm": "ospo-events",
  "enabled": true,
  "displayName": "OSPO Events Management",
  "registrationAllowed": true,
  "resetPasswordAllowed": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "loginTheme": "keycloak",
  "accountTheme": "keycloak",
  "emailTheme": "keycloak",
  "adminTheme": "keycloak",
  "sslRequired": "external",
  "bruteForceProtected": true,
  "otpPolicyType": "totp",
  "otpPolicyAlgorithm": "HmacSHA1",
  "otpPolicyInitialCounter": 0,
  "otpPolicyDigits": 6,
  "otpPolicyLookAheadWindow": 1,
  "otpPolicyPeriod": 30,
  "browserFlow": "browser"
}
EOF

  # Import realm
  /opt/keycloak/bin/kcadm.sh create realms -f /tmp/ospo-realm.json
}

# Create a client for our application
create_client() {
  echo "Creating OSPO Events client..."
  
  # Create a client configuration JSON
  cat > /tmp/ospo-client.json << EOF
{
  "clientId": "ospo-events-app",
  "enabled": true,
  "redirectUris": ["http://localhost:5000/*"],
  "webOrigins": ["http://localhost:5000"],
  "publicClient": true,
  "directAccessGrantsEnabled": true,
  "standardFlowEnabled": true,
  "fullScopeAllowed": true,
  "protocol": "openid-connect"
}
EOF

  # Import client
  /opt/keycloak/bin/kcadm.sh create clients -r ospo-events -f /tmp/ospo-client.json
}

# Configure 2FA for the realm
configure_2fa() {
  echo "Configuring 2FA (TOTP)..."
  
  # Update realm settings for 2FA
  cat > /tmp/ospo-2fa.json << EOF
{
  "otpPolicyType": "totp",
  "otpPolicyAlgorithm": "HmacSHA1",
  "otpPolicyDigits": 6,
  "otpPolicyLookAheadWindow": 1,
  "otpPolicyPeriod": 30,
  "otpSupportedApplications": ["FreeOTP", "Google Authenticator"]
}
EOF

  # Update realm for 2FA
  /opt/keycloak/bin/kcadm.sh update realms/ospo-events -f /tmp/ospo-2fa.json
  
  # Create a browser authentication flow that requires OTP
  cat > /tmp/ospo-browser-flow.json << EOF
{
  "alias": "browser-with-2fa",
  "providerId": "basic-flow",
  "topLevel": true,
  "builtIn": false
}
EOF

  # Create the authentication flow
  /opt/keycloak/bin/kcadm.sh create authentication/flows -r ospo-events -f /tmp/ospo-browser-flow.json
  
  # Add cookie authenticator to the flow
  cat > /tmp/ospo-cookie.json << EOF
{
  "provider": "auth-cookie",
  "requirement": "ALTERNATIVE",
  "alias": "Cookie",
  "description": "Cookie based authentication"
}
EOF

  # Create the cookie execution
  /opt/keycloak/bin/kcadm.sh create authentication/flows/browser-with-2fa/executions/execution -r ospo-events -f /tmp/ospo-cookie.json
  
  # Add username password form
  cat > /tmp/ospo-username-password.json << EOF
{
  "provider": "auth-username-password-form",
  "requirement": "REQUIRED",
  "alias": "Username Password Form",
  "description": "Username and password authentication"
}
EOF

  # Create the username password execution
  /opt/keycloak/bin/kcadm.sh create authentication/flows/browser-with-2fa/executions/execution -r ospo-events -f /tmp/ospo-username-password.json
  
  # Add OTP form
  cat > /tmp/ospo-otp.json << EOF
{
  "provider": "auth-otp-form",
  "requirement": "REQUIRED",
  "alias": "OTP Form",
  "description": "OTP authentication"
}
EOF

  # Create the OTP execution
  /opt/keycloak/bin/kcadm.sh create authentication/flows/browser-with-2fa/executions/execution -r ospo-events -f /tmp/ospo-otp.json
  
  # Set the new flow as browser flow
  cat > /tmp/ospo-realm-browser.json << EOF
{
  "browserFlow": "browser-with-2fa"
}
EOF

  # Update realm browser flow
  /opt/keycloak/bin/kcadm.sh update realms/ospo-events -f /tmp/ospo-realm-browser.json
}

# main script execution
main() {
  start_keycloak
  
  # Wait for Keycloak to start
  echo "Waiting for Keycloak to start..."
  sleep 20
  
  # Login to admin console
  /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user admin --password admin
  
  create_realm
  create_client
  configure_2fa
  
  echo "Keycloak setup complete! Your Keycloak server is running at http://localhost:8080/auth"
  echo "Admin console: http://localhost:8080/auth/admin/"
  echo "Login with username: admin and password: admin"
}

main