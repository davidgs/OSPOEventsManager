#!/bin/bash

# Test script for OSPO Events Manager deployment
# This script verifies that a deployment is complete and functional

set -e

NAMESPACE=${1:-prod-rh-events-org}
RELEASE_NAME=${2:-ospo-events}
TIMEOUT=${3:-300}  # 5 minutes timeout

echo "Testing OSPO Events Manager deployment..."
echo "Namespace: $NAMESPACE"
echo "Release: $RELEASE_NAME"
echo "Timeout: ${TIMEOUT}s"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "SUCCESS" ]; then
        echo -e "${GREEN}✓ $2${NC}"
    elif [ "$1" = "FAIL" ]; then
        echo -e "${RED}✗ $2${NC}"
    elif [ "$1" = "WARNING" ]; then
        echo -e "${YELLOW}⚠ $2${NC}"
    else
        echo -e "${YELLOW}ℹ $2${NC}"
    fi
}

# Function to wait for deployment
wait_for_deployment() {
    local deployment=$1
    local max_wait=$2
    local waited=0

    echo "Waiting for deployment $deployment to be ready..."

    while [ $waited -lt $max_wait ]; do
        if kubectl get deployment $deployment -n $NAMESPACE >/dev/null 2>&1; then
            local ready=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
            local desired=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.spec.replicas}')

            if [ "$ready" = "$desired" ] && [ "$ready" != "" ]; then
                print_status "SUCCESS" "Deployment $deployment is ready ($ready/$desired)"
                return 0
            fi
        fi

        echo "  Waiting... ($waited/${max_wait}s)"
        sleep 5
        waited=$((waited + 5))
    done

    print_status "FAIL" "Deployment $deployment did not become ready within ${max_wait}s"
    return 1
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    local max_retries=${4:-5}

    echo "Testing: $description"
    echo "  URL: $url"

    for i in $(seq 1 $max_retries); do
        if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
            if [ "$response" = "$expected_status" ]; then
                print_status "SUCCESS" "$description - HTTP $response"
                return 0
            else
                echo "  Attempt $i: HTTP $response (expected $expected_status)"
            fi
        else
            echo "  Attempt $i: Connection failed"
        fi

        if [ $i -lt $max_retries ]; then
            sleep 10
        fi
    done

    print_status "FAIL" "$description - Expected HTTP $expected_status"
    return 1
}

# Function to test Keycloak realm configuration
test_keycloak_realm() {
    local keycloak_url=$1
    local realm_name=$2

    echo "Testing Keycloak realm configuration..."

    # Test realm endpoint
    local realm_url="${keycloak_url}/realms/${realm_name}"
    if curl -s -f "$realm_url" >/dev/null 2>&1; then
        print_status "SUCCESS" "Keycloak realm '$realm_name' is accessible"

        # Test OpenID Connect configuration
        local oidc_config_url="${realm_url}/.well-known/openid_configuration"
        if curl -s -f "$oidc_config_url" >/dev/null 2>&1; then
            print_status "SUCCESS" "OpenID Connect configuration is available"

            # Parse and validate key endpoints
            local config=$(curl -s "$oidc_config_url")
            local token_endpoint=$(echo "$config" | jq -r '.token_endpoint // empty')
            local userinfo_endpoint=$(echo "$config" | jq -r '.userinfo_endpoint // empty')

            if [ -n "$token_endpoint" ] && [ -n "$userinfo_endpoint" ]; then
                print_status "SUCCESS" "Token and userinfo endpoints are configured"
                return 0
            else
                print_status "FAIL" "Missing required endpoints in OpenID Connect configuration"
                return 1
            fi
        else
            print_status "FAIL" "OpenID Connect configuration is not available"
            return 1
        fi
    else
        print_status "FAIL" "Keycloak realm '$realm_name' is not accessible"
        return 1
    fi
}

# Function to test database connectivity
test_database() {
    local pg_pod=$1

    echo "Testing database connectivity..."

    if kubectl exec -n $NAMESPACE $pg_pod -- psql -U ospo_user -d ospo_events -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "SUCCESS" "Database connection successful"

        # Test key tables exist
        local tables="users events attendees cfp_submissions sponsorships assets stakeholders approval_workflows"
        local missing_tables=""

        for table in $tables; do
            if ! kubectl exec -n $NAMESPACE $pg_pod -- psql -U ospo_user -d ospo_events -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
                missing_tables="$missing_tables $table"
            fi
        done

        if [ -z "$missing_tables" ]; then
            print_status "SUCCESS" "All required database tables exist"
            return 0
        else
            print_status "FAIL" "Missing database tables:$missing_tables"
            return 1
        fi
    else
        print_status "FAIL" "Database connection failed"
        return 1
    fi
}

# Main test execution
main() {
    local failed_tests=0

    echo "1. Testing deployment status..."

    # Test deployments
    local deployments="$RELEASE_NAME-ospo-app $RELEASE_NAME-keycloak $RELEASE_NAME-postgres $RELEASE_NAME-minio"

    for deployment in $deployments; do
        if ! wait_for_deployment "$deployment" 120; then
            failed_tests=$((failed_tests + 1))
        fi
    done

    echo ""
    echo "2. Testing service endpoints..."

    # Get route URLs
    local app_route=$(kubectl get route $RELEASE_NAME-ospo-app -n $NAMESPACE -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
    local keycloak_route=$(kubectl get route $RELEASE_NAME-keycloak -n $NAMESPACE -o jsonpath='{.spec.host}' 2>/dev/null || echo "")

    if [ -n "$app_route" ]; then
        local app_url="https://$app_route"
        if ! test_endpoint "$app_url" "200" "Application main page"; then
            failed_tests=$((failed_tests + 1))
        fi

        if ! test_endpoint "$app_url/api/health" "200" "Application health endpoint"; then
            failed_tests=$((failed_tests + 1))
        fi
    else
        print_status "FAIL" "Application route not found"
        failed_tests=$((failed_tests + 1))
    fi

    if [ -n "$keycloak_route" ]; then
        local keycloak_url="https://$keycloak_route/auth"
        if ! test_endpoint "$keycloak_url" "200" "Keycloak main page"; then
            failed_tests=$((failed_tests + 1))
        fi

        if ! test_keycloak_realm "$keycloak_url" "ospo-events"; then
            failed_tests=$((failed_tests + 1))
        fi
    else
        print_status "FAIL" "Keycloak route not found"
        failed_tests=$((failed_tests + 1))
    fi

    echo ""
    echo "3. Testing database..."

    # Get PostgreSQL pod
    local pg_pod=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [ -n "$pg_pod" ]; then
        if ! test_database "$pg_pod"; then
            failed_tests=$((failed_tests + 1))
        fi
    else
        print_status "FAIL" "PostgreSQL pod not found"
        failed_tests=$((failed_tests + 1))
    fi

    echo ""
    echo "4. Testing post-deployment job..."

    # Check if post-deployment job completed successfully
    local job_name="$RELEASE_NAME-post-start"
    local job_status=$(kubectl get job $job_name -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' 2>/dev/null || echo "")

    if [ "$job_status" = "True" ]; then
        print_status "SUCCESS" "Post-deployment job completed successfully"
    else
        print_status "WARNING" "Post-deployment job status unclear - check kubectl get job $job_name -n $NAMESPACE"
    fi

    echo ""
    echo "=========================================="
    echo "Test Summary:"

    if [ $failed_tests -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! 🎉"
        echo ""
        echo "Your OSPO Events Manager deployment is ready!"
        echo "App URL: https://$app_route"
        echo "Keycloak URL: https://$keycloak_route/auth"
        echo ""
        echo "Next steps:"
        echo "1. Visit the app URL to test login"
        echo "2. Create your first event"
        echo "3. Verify all features work as expected"
        return 0
    else
        print_status "FAIL" "$failed_tests test(s) failed"
        echo ""
        echo "Troubleshooting:"
        echo "1. Check pod logs: kubectl logs -n $NAMESPACE <pod-name>"
        echo "2. Check job status: kubectl get jobs -n $NAMESPACE"
        echo "3. Check routes: kubectl get routes -n $NAMESPACE"
        echo "4. Check events: kubectl get events -n $NAMESPACE --sort-by=.metadata.creationTimestamp"
        return 1
    fi
}

# Check dependencies
if ! command -v kubectl >/dev/null 2>&1; then
    print_status "FAIL" "kubectl is not installed or not in PATH"
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    print_status "FAIL" "curl is not installed or not in PATH"
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    print_status "FAIL" "jq is not installed or not in PATH"
    exit 1
fi

# Run main test
main
exit_code=$?

echo ""
echo "Test completed with exit code: $exit_code"
exit $exit_code