#!/bin/bash

# OSPO Events Manager - Configuration Script
# This script helps configure the .env file from env.template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_prompt() {
    echo -e "${PURPLE}❓ $1${NC}"
}

# Function to generate secure random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate JWT/Session secret
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || \
    openssl rand -hex 32
}

# Function to generate client secret
generate_client_secret() {
    uuidgen | tr -d '-' | cut -c1-32
}

# Function to validate email
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate URL
validate_url() {
    local url=$1
    if [[ $url =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to get user input with default value
get_input() {
    local prompt=$1
    local default=$2
    local required=${3:-false}
    local validator=$4

    while true; do
        if [[ -n "$default" ]]; then
            read -p "$prompt [$default]: " input
            input=${input:-$default}
        else
            read -p "$prompt: " input
        fi

        if [[ "$required" == "true" && -z "$input" ]]; then
            print_error "This field is required. Please enter a value."
            continue
        fi

        if [[ -n "$validator" && -n "$input" ]]; then
            if ! $validator "$input"; then
                print_error "Invalid format. Please try again."
                continue
            fi
        fi

        echo "$input"
        break
    done
}

# Function to ask yes/no question
ask_yes_no() {
    local prompt=$1
    local default=${2:-y}

    while true; do
        if [[ "$default" == "y" ]]; then
            read -p "$prompt [Y/n]: " answer
            answer=${answer:-y}
        else
            read -p "$prompt [y/N]: " answer
            answer=${answer:-n}
        fi

        case $answer in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) print_error "Please answer yes or no.";;
        esac
    done
}

# Function to show usage
show_usage() {
    echo "OSPO Events Manager Configuration Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help         Show this help message"
    echo "  --interactive  Run in interactive mode (default)"
    echo "  --quick        Quick setup with auto-generated values"
    echo "  --env-only     Only configure environment (dev/prod)"
    echo "  -o FILE        Output file (default: stdout)"
    echo ""
    echo "This script will:"
    echo "  - Walk through env.template"
    echo "  - Ask for configuration values"
    echo "  - Generate secure passwords and secrets"
    echo "  - Create a working .env file or output to specified file"
    echo ""
    echo "Examples:"
    echo "  $0                    # Interactive mode, output to .env"
    echo "  $0 --quick            # Quick setup, output to .env"
    echo "  $0 -o config.env      # Interactive mode, output to config.env"
    echo "  $0 --quick -o -       # Quick setup, output to stdout"
    echo ""
}

# Main configuration function
configure_env() {
    local mode=${1:-interactive}

    print_header "OSPO Events Manager Configuration"
    echo ""
    print_info "This script will help you configure your environment file from env.template"
    echo ""

    # Check if env.template exists
    if [[ ! -f "env.template" ]]; then
        print_error "env.template file not found!"
        print_info "Please run this script from the project root directory."
        exit 1
    fi

    # Handle output file logic
    TEMP_ENV_FILE=".env.temp"
    local final_output_file="$OUTPUT_FILE"

    # If output is stdout, use temp file then cat it
    if [[ "$OUTPUT_FILE" == "-" ]]; then
        final_output_file="$TEMP_ENV_FILE"
    else
        # Check if output file already exists (unless it's .env which we handle specially)
        if [[ -f "$OUTPUT_FILE" && "$OUTPUT_FILE" != ".env" ]]; then
            print_warning "Output file '$OUTPUT_FILE' already exists!"
            if ! ask_yes_no "Do you want to overwrite it?" "n"; then
                print_info "Configuration cancelled."
                exit 0
            fi
        fi

        # Special handling for .env file
        if [[ "$OUTPUT_FILE" == ".env" ]]; then
            if [[ -f ".env" ]]; then
                print_warning "A .env file already exists!"
                if ! ask_yes_no "Do you want to overwrite it?" "n"; then
                    print_info "Configuration cancelled."
                    exit 0
                fi
                print_info "Backing up existing .env to .env.backup"
                cp .env .env.backup
            fi
        fi
    fi

    # Start with a copy of the template
    cp env.template "$TEMP_ENV_FILE"

    print_success "Starting configuration process..."
    echo ""

    # Environment selection
    print_header "Environment Configuration"
    print_info "Choose your deployment environment:"
    echo "  dev  - Development environment"
    echo "  prod - Production environment"
    echo ""

    ENVIRONMENT=$(get_input "Environment (dev/prod)" "dev" "true")

    # Update environment in temp file
    sed -i.bak "s/^ENVIRONMENT=.*/ENVIRONMENT=$ENVIRONMENT/" "$TEMP_ENV_FILE"

    if [[ "$mode" == "quick" ]]; then
        print_info "Quick setup mode: Auto-generating all secure values..."
        configure_quick_setup
    else
        configure_interactive
    fi

    # Final validation and summary
    validate_and_summarize
}

# Quick setup with auto-generated values
configure_quick_setup() {
    print_header "Quick Setup - Auto-Generating Secure Values"

    # Generate all passwords and secrets
    POSTGRES_PASSWORD=$(generate_password 24)
    KEYCLOAK_ADMIN_PASSWORD=$(generate_password 24)
    KEYCLOAK_DB_PASSWORD=$(generate_password 24)
    KEYCLOAK_CLIENT_SECRET=$(generate_client_secret)
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    MINIO_PASSWORD=$(generate_password 24)
    PGADMIN_PASSWORD=$(generate_password 16)

    # Update temp file with generated values
    sed -i.bak "s/secure_password_here/$POSTGRES_PASSWORD/" "$TEMP_ENV_FILE"
    sed -i.bak "s/admin_password_here/$KEYCLOAK_ADMIN_PASSWORD/" "$TEMP_ENV_FILE"
    sed -i.bak "s/keycloak_db_password_here/$KEYCLOAK_DB_PASSWORD/" "$TEMP_ENV_FILE"
    sed -i.bak "s/your-client-secret-here/$KEYCLOAK_CLIENT_SECRET/" "$TEMP_ENV_FILE"
    sed -i.bak "s/your-jwt-secret-here-min-32-chars/$JWT_SECRET/" "$TEMP_ENV_FILE"
    sed -i.bak "s/your-session-secret-here-min-32-chars/$SESSION_SECRET/" "$TEMP_ENV_FILE"
    sed -i.bak "s/minio_password_here/$MINIO_PASSWORD/" "$TEMP_ENV_FILE"
    sed -i.bak "s/admin_password_here/$PGADMIN_PASSWORD/" "$TEMP_ENV_FILE"

    # Generate Docker Hub credentials if needed
    if ask_yes_no "Do you have Docker Hub credentials to avoid rate limits?" "n"; then
        configure_dockerhub
    else
        # Remove Docker Hub credentials
        sed -i.bak "s/DOCKERHUB_USERNAME=.*/DOCKERHUB_USERNAME=/" "$TEMP_ENV_FILE"
        sed -i.bak "s/DOCKERHUB_TOKEN=.*/DOCKERHUB_TOKEN=/" "$TEMP_ENV_FILE"
        sed -i.bak "s/DOCKERHUB_EMAIL=.*/DOCKERHUB_EMAIL=/" "$TEMP_ENV_FILE"
    fi

    # Configure OpenShift token
    configure_openshift

    # Clean up backup files
    rm -f "$TEMP_ENV_FILE.bak"
}

# Interactive configuration
configure_interactive() {
    print_header "Database Configuration"
    print_info "PostgreSQL database settings"

    POSTGRES_DB=$(get_input "Database name" "ospo_events" "true")
    POSTGRES_USER=$(get_input "Database user" "ospo_user" "true")

    if ask_yes_no "Generate secure password for PostgreSQL?" "y"; then
        POSTGRES_PASSWORD=$(generate_password 24)
        print_success "Generated secure password: $POSTGRES_PASSWORD"
    else
        POSTGRES_PASSWORD=$(get_input "PostgreSQL password" "" "true")
    fi

    # Update database settings
    sed -i.bak "s/^POSTGRES_DB=.*/POSTGRES_DB=$POSTGRES_DB/" "$TEMP_ENV_FILE"
    sed -i.bak "s/^POSTGRES_USER=.*/POSTGRES_USER=$POSTGRES_USER/" "$TEMP_ENV_FILE"
    sed -i.bak "s/secure_password_here/$POSTGRES_PASSWORD/" "$TEMP_ENV_FILE"

    echo ""
    print_header "Keycloak Configuration"
    print_info "Keycloak authentication settings"

    KEYCLOAK_ADMIN=$(get_input "Keycloak admin username" "admin" "true")

    if ask_yes_no "Generate secure password for Keycloak admin?" "y"; then
        KEYCLOAK_ADMIN_PASSWORD=$(generate_password 24)
        print_success "Generated secure password: $KEYCLOAK_ADMIN_PASSWORD"
    else
        KEYCLOAK_ADMIN_PASSWORD=$(get_input "Keycloak admin password" "" "true")
    fi

    KEYCLOAK_REALM=$(get_input "Keycloak realm" "ospo-events" "true")
    KEYCLOAK_CLIENT_ID=$(get_input "Keycloak client ID" "ospo-events-app" "true")

    if ask_yes_no "Generate secure client secret?" "y"; then
        KEYCLOAK_CLIENT_SECRET=$(generate_client_secret)
        print_success "Generated client secret: $KEYCLOAK_CLIENT_SECRET"
    else
        KEYCLOAK_CLIENT_SECRET=$(get_input "Keycloak client secret" "" "true")
    fi

    # Keycloak database settings
    KEYCLOAK_DB_NAME=$(get_input "Keycloak database name" "keycloak" "true")
    KEYCLOAK_DB_USER=$(get_input "Keycloak database user" "keycloak_user" "true")

    if ask_yes_no "Generate secure password for Keycloak database?" "y"; then
        KEYCLOAK_DB_PASSWORD=$(generate_password 24)
        print_success "Generated secure password: $KEYCLOAK_DB_PASSWORD"
    else
        KEYCLOAK_DB_PASSWORD=$(get_input "Keycloak database password" "" "true")
    fi

    # Update Keycloak settings
    sed -i.bak "s/^KEYCLOAK_ADMIN=.*/KEYCLOAK_ADMIN=$KEYCLOAK_ADMIN/" "$TEMP_ENV_FILE"
    sed -i.bak "s/admin_password_here/$KEYCLOAK_ADMIN_PASSWORD/" "$TEMP_ENV_FILE"
    sed -i.bak "s/^KEYCLOAK_REALM=.*/KEYCLOAK_REALM=$KEYCLOAK_REALM/" "$TEMP_ENV_FILE"
    sed -i.bak "s/^KEYCLOAK_CLIENT_ID=.*/KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID/" "$TEMP_ENV_FILE"
    sed -i.bak "s/your-client-secret-here/$KEYCLOAK_CLIENT_SECRET/" "$TEMP_ENV_FILE"
    sed -i.bak "s/^KEYCLOAK_DB_NAME=.*/KEYCLOAK_DB_NAME=$KEYCLOAK_DB_NAME/" "$TEMP_ENV_FILE"
    sed -i.bak "s/^KEYCLOAK_DB_USER=.*/KEYCLOAK_DB_USER=$KEYCLOAK_DB_USER/" "$TEMP_ENV_FILE"
    sed -i.bak "s/keycloak_db_password_here/$KEYCLOAK_DB_PASSWORD/" "$TEMP_ENV_FILE"

    echo ""
    print_header "Application Security"
    print_info "JWT and session secrets"

    if ask_yes_no "Generate secure JWT secret?" "y"; then
        JWT_SECRET=$(generate_secret)
        print_success "Generated JWT secret: $JWT_SECRET"
    else
        JWT_SECRET=$(get_input "JWT secret (min 32 chars)" "" "true")
    fi

    if ask_yes_no "Generate secure session secret?" "y"; then
        SESSION_SECRET=$(generate_secret)
        print_success "Generated session secret: $SESSION_SECRET"
    else
        SESSION_SECRET=$(get_input "Session secret (min 32 chars)" "" "true")
    fi

    # Update security settings
    sed -i.bak "s/your-jwt-secret-here-min-32-chars/$JWT_SECRET/" "$TEMP_ENV_FILE"
    sed -i.bak "s/your-session-secret-here-min-32-chars/$SESSION_SECRET/" "$TEMP_ENV_FILE"

    echo ""
    print_header "MinIO Configuration"
    print_info "Object storage settings"

    MINIO_ROOT_USER=$(get_input "MinIO root user" "minioadmin" "true")

    if ask_yes_no "Generate secure password for MinIO?" "y"; then
        MINIO_PASSWORD=$(generate_password 24)
        print_success "Generated secure password: $MINIO_PASSWORD"
    else
        MINIO_PASSWORD=$(get_input "MinIO root password" "" "true")
    fi

    MINIO_BUCKET_NAME=$(get_input "MinIO bucket name" "ospo-uploads" "true")

    # Update MinIO settings
    sed -i.bak "s/^MINIO_ROOT_USER=.*/MINIO_ROOT_USER=$MINIO_ROOT_USER/" "$TEMP_ENV_FILE"
    sed -i.bak "s/minio_password_here/$MINIO_PASSWORD/" "$TEMP_ENV_FILE"
    sed -i.bak "s/^MINIO_BUCKET_NAME=.*/MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME/" "$TEMP_ENV_FILE"

    echo ""
    print_header "PgAdmin Configuration"
    print_info "Database administration tool"

    PGADMIN_EMAIL=$(get_input "PgAdmin email" "admin@ospo.example.com" "true" "validate_email")

    if ask_yes_no "Generate secure password for PgAdmin?" "y"; then
        PGADMIN_PASSWORD=$(generate_password 16)
        print_success "Generated secure password: $PGADMIN_PASSWORD"
    else
        PGADMIN_PASSWORD=$(get_input "PgAdmin password" "" "true")
    fi

    # Update PgAdmin settings
    sed -i.bak "s/^PGADMIN_DEFAULT_EMAIL=.*/PGADMIN_DEFAULT_EMAIL=$PGADMIN_EMAIL/" "$TEMP_ENV_FILE"
    sed -i.bak "s/admin_password_here/$PGADMIN_PASSWORD/" "$TEMP_ENV_FILE"

    # Configure Docker Hub
    configure_dockerhub

    # Configure OpenShift
    configure_openshift

    # Clean up backup files
    rm -f .env.bak
}

# Configure Docker Hub credentials
configure_dockerhub() {
    echo ""
    print_header "Docker Hub Configuration"
    print_info "Docker Hub credentials help avoid rate limiting"

    if ask_yes_no "Do you have Docker Hub credentials?" "n"; then
        DOCKERHUB_USERNAME=$(get_input "Docker Hub username" "" "true")
        DOCKERHUB_TOKEN=$(get_input "Docker Hub token" "" "true")
        DOCKERHUB_EMAIL=$(get_input "Docker Hub email" "" "true" "validate_email")

        # Update Docker Hub settings
        sed -i.bak "s/DOCKERHUB_USERNAME=.*/DOCKERHUB_USERNAME=$DOCKERHUB_USERNAME/" "$TEMP_ENV_FILE"
        sed -i.bak "s/DOCKERHUB_TOKEN=.*/DOCKERHUB_TOKEN=$DOCKERHUB_TOKEN/" "$TEMP_ENV_FILE"
        sed -i.bak "s/DOCKERHUB_EMAIL=.*/DOCKERHUB_EMAIL=$DOCKERHUB_EMAIL/" "$TEMP_ENV_FILE"
    else
        print_info "Skipping Docker Hub configuration"
        # Clear Docker Hub credentials
        sed -i.bak "s/DOCKERHUB_USERNAME=.*/DOCKERHUB_USERNAME=/" "$TEMP_ENV_FILE"
        sed -i.bak "s/DOCKERHUB_TOKEN=.*/DOCKERHUB_TOKEN=/" "$TEMP_ENV_FILE"
        sed -i.bak "s/DOCKERHUB_EMAIL=.*/DOCKERHUB_EMAIL=/" "$TEMP_ENV_FILE"
    fi
}

# Configure OpenShift settings
configure_openshift() {
    echo ""
    print_header "OpenShift Configuration"
    print_info "OpenShift cluster settings"

    OPENSHIFT_SERVER=$(get_input "OpenShift server URL" "https://api.ospo-osci.z3b1.p1.openshiftapps.com:6443" "true" "validate_url")
    CLUSTER_DOMAIN=$(get_input "Cluster domain" "apps.ospo-osci.z3b1.p1.openshiftapps.com" "true")

    print_info "To get your OpenShift token, run: oc whoami --show-token"
    OPENSHIFT_TOKEN=$(get_input "OpenShift token" "" "true")

    # Update OpenShift settings
    sed -i.bak "s|^OPENSHIFT_SERVER=.*|OPENSHIFT_SERVER=$OPENSHIFT_SERVER|" "$TEMP_ENV_FILE"
    sed -i.bak "s/^CLUSTER_DOMAIN=.*/CLUSTER_DOMAIN=$CLUSTER_DOMAIN/" "$TEMP_ENV_FILE"
    sed -i.bak "s/your-openshift-token-here/$OPENSHIFT_TOKEN/" "$TEMP_ENV_FILE"
}

# Validate configuration and show summary
validate_and_summarize() {
    print_header "Configuration Summary"

    # Check for any remaining placeholder values
    local placeholders=$(grep -E "(secure_password_here|admin_password_here|keycloak_db_password_here|your-client-secret-here|your-jwt-secret-here|your-session-secret-here|minio_password_here|your-openshift-token-here)" "$TEMP_ENV_FILE" || true)

    if [[ -n "$placeholders" ]]; then
        print_warning "Some placeholder values were not replaced:"
        echo "$placeholders"
        echo ""
        if ! ask_yes_no "Do you want to continue anyway?" "n"; then
            print_error "Configuration incomplete. Please run the script again."
            rm -f "$TEMP_ENV_FILE"
            exit 1
        fi
    fi

    # Move temp file to final output location
    if [[ "$OUTPUT_FILE" == "-" ]]; then
        # Output to stdout
        cat "$TEMP_ENV_FILE"
        rm -f "$TEMP_ENV_FILE"
        print_info "Configuration output to stdout"
    else
        # Move to final file
        mv "$TEMP_ENV_FILE" "$OUTPUT_FILE"
        print_success "Configuration completed successfully!"
        echo ""
        print_info "Generated $OUTPUT_FILE file with the following settings:"
        echo ""

        # Show key configuration values
        echo "Environment: $(grep "^ENVIRONMENT=" "$OUTPUT_FILE" | cut -d'=' -f2)"
        echo "Database: $(grep "^POSTGRES_DB=" "$OUTPUT_FILE" | cut -d'=' -f2)"
        echo "Keycloak Realm: $(grep "^KEYCLOAK_REALM=" "$OUTPUT_FILE" | cut -d'=' -f2)"
        echo "OpenShift Server: $(grep "^OPENSHIFT_SERVER=" "$OUTPUT_FILE" | cut -d'=' -f2)"
        echo ""

        print_warning "Important Security Notes:"
        echo "  - Keep your $OUTPUT_FILE file secure and never commit it to git"
        echo "  - Store passwords and secrets securely"
        echo "  - Consider using a password manager for production"
        echo "  - Regularly rotate passwords and secrets"
        echo ""

        print_info "Next steps:"
        echo "  1. Review the generated $OUTPUT_FILE file"
        if [[ "$OUTPUT_FILE" == ".env" ]]; then
            echo "  2. Run: ./deploy.sh --dev (or --prod)"
            echo "  3. Check deployment status with: oc get pods"
        else
            echo "  2. Copy $OUTPUT_FILE to .env: cp $OUTPUT_FILE .env"
            echo "  3. Run: ./deploy.sh --dev (or --prod)"
            echo "  4. Check deployment status with: oc get pods"
        fi
        echo ""

        if ask_yes_no "Do you want to view the generated $OUTPUT_FILE file?" "n"; then
            echo ""
            print_header "$OUTPUT_FILE File Contents"
            cat "$OUTPUT_FILE"
        fi
    fi
}

# Global variables
MODE="interactive"
OUTPUT_FILE=".env"
TEMP_ENV_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_usage
            exit 0
            ;;
        --interactive)
            MODE="interactive"
            shift
            ;;
        --quick)
            MODE="quick"
            shift
            ;;
        --env-only)
            MODE="env-only"
            shift
            ;;
        -o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check dependencies
if ! command -v openssl &> /dev/null; then
    print_error "openssl is required but not installed."
    print_info "Please install openssl to generate secure passwords."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_warning "node is not installed. JWT/Session secrets will use openssl instead of node crypto."
fi

if ! command -v uuidgen &> /dev/null; then
    print_warning "uuidgen is not available. Client secrets will use openssl instead."
fi

# Run configuration
configure_env "$MODE"
