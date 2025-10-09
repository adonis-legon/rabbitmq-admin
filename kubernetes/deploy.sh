#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-dev}
NAMESPACE="rabbitmq-admin"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Function to deploy the application
deploy_application() {
    print_status "Deploying RabbitMQ Admin to Kubernetes..."
    
    # Apply all manifests
    kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"
    
    # Create secret
    create_secret
    
    # Apply other manifests
    kubectl apply -f "${SCRIPT_DIR}/deployment.yaml"
    kubectl apply -f "${SCRIPT_DIR}/service.yaml"
    kubectl apply -f "${SCRIPT_DIR}/ingress.yaml"
    
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
}

# Usage information
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [environment]"
    echo ""
    echo "Arguments:"
    echo "  environment    Environment name (default: dev)"
    echo "                 Looks for .env.[environment] file"
    echo ""
    echo "Examples:"
    echo "  $0 dev         # Uses .env.dev"
    echo "  $0 prod        # Uses .env.prod"
    echo "  $0 staging     # Uses .env.staging"
    echo ""
    echo "Prerequisites:"
    echo "  - kubectl installed and configured"
    echo "  - Access to Kubernetes cluster"
    echo "  - Environment file (.env.[environment]) with required variables"
    echo ""
    exit 0
fi

# Run main function
main "$@"