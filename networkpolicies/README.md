# Network Policies for OSPO Events Manager

## Overview

Since Otterize cannot be installed due to insufficient cluster permissions, we've implemented manual NetworkPolicies to provide zero-trust networking for the OSPO Events Manager application.

## Implemented Policies

### 1. Application Network Policy (`ospo-app-targeted-policy`)
- **Target**: Main application pods (`app.kubernetes.io/component: application`)
- **Ingress**: Allows external traffic on port 4576 (application port)
- **Egress**:
  - DNS resolution (UDP/TCP port 53)
  - PostgreSQL connection (port 5432)
  - Keycloak connection (port 8080)
  - MinIO connection (port 9000)
  - HTTPS/HTTP outbound (ports 443/80)

### 2. PostgreSQL Network Policy (`postgres-targeted-policy`)
- **Target**: PostgreSQL pods (`app.kubernetes.io/component: database`)
- **Ingress**: Allows connections from application and Keycloak on port 5432
- **Egress**: DNS resolution only

### 3. Keycloak Network Policy (`keycloak-targeted-policy`)
- **Target**: Keycloak pods (`app.kubernetes.io/component: auth`)
- **Ingress**:
  - Application connections on port 8080
  - External traffic (for user authentication)
- **Egress**:
  - DNS resolution
  - PostgreSQL connection (port 5432)
  - HTTPS outbound (port 443)

### 4. MinIO Network Policy (`minio-targeted-policy`)
- **Target**: MinIO pods (`app.kubernetes.io/component: storage`)
- **Ingress**:
  - Application connections on ports 9000/9001
  - External traffic (for file access)
- **Egress**: DNS resolution only

## Security Benefits

1. **Microsegmentation**: Each component can only communicate with necessary services
2. **Least Privilege**: Only required ports and protocols are allowed
3. **DNS Security**: DNS resolution is explicitly allowed to prevent connectivity issues
4. **External Access Control**: External traffic is only allowed where necessary

## Deployment

```bash
# Apply the targeted network policies
oc apply -f networkpolicies/targeted-network-policy.yaml

# Verify policies are applied
oc get networkpolicies -n prod-rh-events-org

# Test application health
curl -s https://ospo-events-ospo-app-prod-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com/api/health
```

## Monitoring

To monitor network policy effectiveness:

```bash
# Check pod connectivity
oc get pods -n prod-rh-events-org

# View network policies
oc describe networkpolicy -n prod-rh-events-org

# Check application logs for connectivity issues
oc logs -f deployment/ospo-events-ospo-app -n prod-rh-events-org
```

## Troubleshooting

If connectivity issues occur:

1. **Check DNS Resolution**: Ensure DNS traffic (UDP/TCP port 53) is allowed
2. **Verify Labels**: Confirm pod labels match the policy selectors
3. **Check Ports**: Ensure the correct ports are specified in policies
4. **Review Logs**: Check application logs for connection errors

## Future Enhancements

When cluster admin permissions are available:

1. **Install Otterize**: For automated intent-based access control
2. **Default Deny Policy**: Implement cluster-wide default deny for stronger security
3. **Egress Controls**: Add more restrictive egress policies
4. **Network Monitoring**: Deploy network monitoring tools for visibility

## Notes

- These policies allow DNS resolution to prevent connectivity issues
- External traffic is allowed where necessary for user access
- Policies are targeted to specific components using Kubernetes labels
- No default deny policy is implemented to maintain operational stability