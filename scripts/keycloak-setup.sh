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

# Create roles for the OSPO Events application
create_roles() {
  echo "Creating roles for OSPO Events application..."
  
  # List of roles to create
  roles=(
    "user"              # Basic user
    "admin"             # System administrator
    "reviewer"          # Can review approval workflows
    "executive"         # Executive stakeholder
    "manager"           # Management stakeholder
    "legal"             # Legal team stakeholder
    "finance"           # Finance team stakeholder
    "marketing"         # Marketing team stakeholder
    "technical"         # Technical team stakeholder
    "event_creator"     # Can create events
    "event_approver"    # Can approve events
    "cfp_reviewer"      # Can review CFP submissions
    "sponsor_manager"   # Can manage sponsorships
    "asset_manager"     # Can manage assets
  )
  
  # Create each role
  for role in "${roles[@]}"; do
    echo "Creating role: $role"
    
    # Create role configuration
    cat > /tmp/ospo-role-$role.json << EOF
{
  "name": "$role",
  "description": "Role for $role in OSPO Events management",
  "composite": false,
  "clientRole": false
}
EOF

    # Import role
    /opt/keycloak/bin/kcadm.sh create roles -r ospo-events -f /tmp/ospo-role-$role.json
  done
  
  # Create role mappings (composite roles)
  
  # Admin has all permissions
  echo "Setting up admin composite role..."
  admin_id=$(/opt/keycloak/bin/kcadm.sh get roles/admin -r ospo-events | grep '"id"' | cut -d'"' -f4)
  
  # Add all other roles to admin
  for role in "${roles[@]}"; do
    if [ "$role" != "admin" ]; then
      echo "Adding $role to admin composite role"
      role_id=$(/opt/keycloak/bin/kcadm.sh get roles/$role -r ospo-events | grep '"id"' | cut -d'"' -f4)
      
      cat > /tmp/ospo-role-mapping-$role.json << EOF
[
  {
    "id": "$role_id",
    "name": "$role"
  }
]
EOF
      
      /opt/keycloak/bin/kcadm.sh create roles/$admin_id/composites -r ospo-events -f /tmp/ospo-role-mapping-$role.json
    fi
  done
  
  echo "All roles created successfully!"
}

# Create default groups
create_groups() {
  echo "Creating default groups..."
  
  # Create groups with their respective roles
  groups=(
    "Administrators:admin"
    "Reviewers:reviewer,cfp_reviewer,event_approver"
    "Event Managers:event_creator,event_approver"
    "Stakeholders:user"
    "Legal Team:legal"
    "Finance Team:finance"
    "Marketing Team:marketing"
    "Technical Team:technical"
  )
  
  for group_info in "${groups[@]}"; do
    group_name=$(echo $group_info | cut -d':' -f1)
    group_roles=$(echo $group_info | cut -d':' -f2)
    
    echo "Creating group: $group_name with roles: $group_roles"
    
    # Create group
    cat > /tmp/ospo-group-$group_name.json << EOF
{
  "name": "$group_name"
}
EOF
    
    # Create the group and get its ID
    group_response=$(/opt/keycloak/bin/kcadm.sh create groups -r ospo-events -f /tmp/ospo-group-$group_name.json --id)
    group_id=$(echo $group_response | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    
    # Add roles to the group
    IFS=',' read -ra ROLES <<< "$group_roles"
    for role in "${ROLES[@]}"; do
      role_id=$(/opt/keycloak/bin/kcadm.sh get roles/$role -r ospo-events | grep '"id"' | cut -d'"' -f4)
      
      cat > /tmp/ospo-group-role-$role.json << EOF
[
  {
    "id": "$role_id",
    "name": "$role"
  }
]
EOF
      
      /opt/keycloak/bin/kcadm.sh create groups/$group_id/role-mappings/realm -r ospo-events -f /tmp/ospo-group-role-$role.json
    done
  done
  
  echo "All groups created successfully!"
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

# Create default admin user
create_default_admin() {
  echo "Creating default admin user..."
  
  # Create admin user
  cat > /tmp/ospo-admin-user.json << EOF
{
  "username": "admin_ospo",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "enabled": true,
  "emailVerified": true,
  "credentials": [
    {
      "type": "password",
      "value": "password",
      "temporary": false
    }
  ]
}
EOF

  # Create user
  user_id=$(/opt/keycloak/bin/kcadm.sh create users -r ospo-events -f /tmp/ospo-admin-user.json --id)
  
  # Add admin role to user
  admin_role_id=$(/opt/keycloak/bin/kcadm.sh get roles/admin -r ospo-events | grep '"id"' | cut -d'"' -f4)
  
  cat > /tmp/ospo-admin-role-mapping.json << EOF
[
  {
    "id": "$admin_role_id",
    "name": "admin"
  }
]
EOF

  /opt/keycloak/bin/kcadm.sh add-roles -r ospo-events --uusername admin_ospo --rolename admin
  
  echo "Default admin user created: admin_ospo / password"
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
  create_roles
  create_groups
  configure_2fa
  create_default_admin
  
  echo "Keycloak setup complete! Your Keycloak server is running at http://localhost:8080/auth"
  echo "Admin console: http://localhost:8080/auth/admin/"
  echo "Login with username: admin and password: admin"
  echo "OSPO Events admin user: admin_ospo / password"
}

main