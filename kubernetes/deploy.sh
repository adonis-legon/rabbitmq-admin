#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
NAMESPACE="rabbitmq-admin"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_PORT_FORWARD=false
PORT_FORWARD_PORT=8080

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to load environment variables from file
load_env_file() {
    local env_file="${SCRIPT_DIR}/.env.${ENVIRONMENT}"
    
    if [[ ! -f "$env_file" ]]; then
        print_error "Environment file $env_file not found!"
        print_status "Please create $env_file based on .env.template"
        exit 1
    fi
    
    print_status "Loading environment variables from $env_file"
    
    # Source the file to load variables
    set -a
    source "$env_file"
    set +a
    
    # Validate required variables
    if [[ -z "$DATABASE_URL" || -z "$DATABASE_USERNAME" || -z "$DATABASE_PASSWORD" || -z "$JWT_SECRET_KEY" ]]; then
        print_error "Missing required environment variables in $env_file"
        print_status "Required variables: DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, JWT_SECRET_KEY"
        exit 1
    fi
    
    # Set defaults for configuration variables if not provided
    AUDIT_WRITE_OPERATIONS_ENABLED=${AUDIT_WRITE_OPERATIONS_ENABLED:-true}
    SERVER_PORT=${SERVER_PORT:-8080}
    SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-production,docker}
    
    print_success "Environment variables loaded successfully"
}

# Function to base64 encode values for Kubernetes secrets
encode_secret() {
    echo -n "$1" | base64
}

# Function to create or update the secret
create_secret() {
    print_status "Creating/updating Kubernetes secret..."
    
    # Create secret with actual values
    kubectl create secret generic rabbitmq-admin-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=DATABASE_URL="$DATABASE_URL" \
        --from-literal=DATABASE_USERNAME="$DATABASE_USERNAME" \
        --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
        --from-literal=JWT_SECRET_KEY="$JWT_SECRET_KEY" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "Secret created/updated successfully"
}

# Function to create or update the ConfigMap
create_configmap() {
    print_status "Creating/updating Kubernetes ConfigMap..."
    
    # Create ConfigMap with actual values
    kubectl create configmap rabbitmq-admin-config \
        --namespace="$NAMESPACE" \
        --from-literal=RABBITMQ_ADMIN_IMAGE_TAG="${RABBITMQ_ADMIN_IMAGE_TAG:-latest}" \
        --from-literal=AUDIT_WRITE_OPERATIONS_ENABLED="$AUDIT_WRITE_OPERATIONS_ENABLED" \
        --from-literal=AUDIT_RETENTION_ENABLED="${AUDIT_RETENTION_ENABLED:-true}" \
        --from-literal=AUDIT_RETENTION_DAYS="${AUDIT_RETENTION_DAYS:-30}" \
        --from-literal=AUDIT_RETENTION_CLEAN_SCHEDULE="${AUDIT_RETENTION_CLEAN_SCHEDULE:-0 0 2 * * ?}" \
        --from-literal=SERVER_PORT="$SERVER_PORT" \
        --from-literal=SPRING_PROFILES_ACTIVE="$SPRING_PROFILES_ACTIVE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "ConfigMap created/updated successfully"
}

# Function to deploy the application
deploy_application() {
    print_status "Deploying RabbitMQ Admin to Kubernetes..."
    
    # Apply all manifests
    kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"
    
    # Create secret and ConfigMap
    create_secret
    create_configmap
    
    # Apply other manifests with environment variable substitution
    # Ensure RABBITMQ_ADMIN_IMAGE_TAG has a default value
    export RABBITMQ_ADMIN_IMAGE_TAG=${RABBITMQ_ADMIN_IMAGE_TAG:-latest}
    # Ensure INGRESS_HOST has a default value
    export INGRESS_HOST=${INGRESS_HOST:-rabbitmq-admin.local}
    envsubst < "${SCRIPT_DIR}/deployment.yaml" | kubectl apply -f -
    kubectl apply -f "${SCRIPT_DIR}/service.yaml"
    envsubst < "${SCRIPT_DIR}/ingress.yaml" | kubectl apply -f -
    
    print_success "Application deployed successfully"
}

# Function to check deployment status
check_deployment_status() {
    print_status "Checking deployment status..."
    
    # Wait for deployment to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/rabbitmq-admin -n "$NAMESPACE"
    
    # Get pod status
    kubectl get pods -n "$NAMESPACE" -l app=rabbitmq-admin
    
    # Get service information
    kubectl get svc -n "$NAMESPACE"
    
    # Get ingress information
    kubectl get ingress -n "$NAMESPACE"
    
    print_success "Deployment status check completed"
}

# Function to show access information
show_access_info() {
    print_status "Access Information:"
    echo ""
    
    # Get service IP
    SERVICE_IP=$(kubectl get svc rabbitmq-admin-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    echo "Service IP: $SERVICE_IP:8080"
    
    # Get ingress information
    INGRESS_HOST=$(kubectl get ingress rabbitmq-admin-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}')
    echo "Ingress Host: $INGRESS_HOST"
    
    # Port forward command
    echo ""
    print_status "To access the application locally, run:"
    echo "kubectl port-forward svc/rabbitmq-admin-service -n $NAMESPACE 8080:8080"
    echo "Then access: http://localhost:8080"
    
    echo ""
    print_status "Default credentials:"
    echo "Username: admin"
    echo "Password: admin123!"
    print_warning "Change these credentials immediately after first login!"
}

# Function to prompt and setup port forwarding
setup_port_forward() {
    echo ""
    print_status "Port Forwarding Setup"
    echo ""
    
    local LOCAL_PORT
    local START_PORT_FORWARD=false
    
    # Check if auto port forwarding is enabled
    if [[ "$AUTO_PORT_FORWARD" == "true" ]]; then
        START_PORT_FORWARD=true
        LOCAL_PORT="$PORT_FORWARD_PORT"
        print_status "Auto port forwarding enabled on port $LOCAL_PORT"
    else
        # Ask user if they want to setup port forwarding
        read -p "Do you want to set up port forwarding now? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            START_PORT_FORWARD=true
            # Ask for local port with default
            echo ""
            read -p "Enter local port to use (default: 8080): " LOCAL_PORT
            LOCAL_PORT=${LOCAL_PORT:-8080}
            
            # Validate port number
            if ! [[ "$LOCAL_PORT" =~ ^[0-9]+$ ]] || [ "$LOCAL_PORT" -lt 1 ] || [ "$LOCAL_PORT" -gt 65535 ]; then
                print_error "Invalid port number. Using default port 8080."
                LOCAL_PORT=8080
            fi
        fi
    fi
    
    if [[ "$START_PORT_FORWARD" == "true" ]]; then
        # Check if port is already in use
        if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $LOCAL_PORT is already in use!"
            if [[ "$AUTO_PORT_FORWARD" == "true" ]]; then
                print_error "Cannot start auto port forwarding on port $LOCAL_PORT (already in use)."
                print_status "You can manually start port forwarding later with:"
                echo "kubectl port-forward svc/rabbitmq-admin-service -n $NAMESPACE <local-port>:8080"
                return
            else
                read -p "Do you want to use a different port? (Y/n): " -n 1 -r
                echo ""
                
                if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                    read -p "Enter alternative port: " LOCAL_PORT
                    LOCAL_PORT=${LOCAL_PORT:-8081}
                    
                    if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
                        print_error "Port $LOCAL_PORT is also in use. Please stop the process or choose another port."
                        print_status "You can manually start port forwarding later with:"
                        echo "kubectl port-forward svc/rabbitmq-admin-service -n $NAMESPACE <local-port>:8080"
                        return
                    fi
                else
                    print_status "Continuing with port $LOCAL_PORT (may conflict with existing service)"
                fi
            fi
        fi
        
        echo ""
        print_status "Starting port forwarding on localhost:$LOCAL_PORT -> service:8080"
        print_status "Press Ctrl+C to stop port forwarding"
        print_success "Application will be available at: http://localhost:$LOCAL_PORT"
        echo ""
        
        # Start port forwarding in foreground
        kubectl port-forward svc/rabbitmq-admin-service -n "$NAMESPACE" "$LOCAL_PORT:8080"
    else
        echo ""
        print_status "Port forwarding skipped. You can start it manually with:"
        echo "kubectl port-forward svc/rabbitmq-admin-service -n $NAMESPACE <local-port>:8080"
    fi
}

# Function to show logs
show_logs() {
    print_status "Recent application logs:"
    kubectl logs -n "$NAMESPACE" -l app=rabbitmq-admin --tail=20
}

# Main execution
main() {
    echo "🚀 RabbitMQ Admin Kubernetes Deployment Script"
    echo "=============================================="
    echo ""
    
    print_status "Deploying to environment: $ENVIRONMENT"
    print_status "Target namespace: $NAMESPACE"
    echo ""
    
    check_prerequisites
    load_env_file
    deploy_application
    check_deployment_status
    echo ""
    show_access_info
    echo ""
    show_logs
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    print_status "Monitor the deployment with: kubectl get pods -n $NAMESPACE -w"
    
    # Offer port forwarding setup
    setup_port_forward
}

# Function to show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS] [environment]"
    echo ""
    echo "Arguments:"
    echo "  environment         Environment name (default: dev)"
    echo "                      Looks for .env.[environment] file"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -p, --port-forward  Automatically start port forwarding after deployment"
    echo "  --port PORT         Specify local port for port forwarding (default: 8080)"
    echo ""
    echo "Examples:"
    echo "  $0 dev                    # Deploy dev environment"
    echo "  $0 prod -p                # Deploy prod with auto port forwarding"
    echo "  $0 staging -p --port 9090 # Deploy staging with port forwarding on port 9090"
    echo ""
    echo "Prerequisites:"
    echo "  - kubectl installed and configured"
    echo "  - Access to Kubernetes cluster"
    echo "  - Environment file (.env.[environment]) with required variables"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -p|--port-forward)
            AUTO_PORT_FORWARD=true
            shift
            ;;
        --port)
            if [[ -n $2 && $2 =~ ^[0-9]+$ ]] && [ "$2" -ge 1 ] && [ "$2" -le 65535 ]; then
                PORT_FORWARD_PORT="$2"
                shift 2
            else
                print_error "Invalid port number: $2"
                exit 1
            fi
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            # First non-option argument is the environment
            if [[ -z "$ENVIRONMENT_SET" ]]; then
                ENVIRONMENT="$1"
                ENVIRONMENT_SET=true
            else
                print_error "Unexpected argument: $1"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Run main function
main