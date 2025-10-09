#!/bin/bash

# Kubernetes Deployment Validation Script
# Checks if all required files and configurations are present

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT=${1:-dev}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "🔍 Kubernetes Deployment Validation"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo ""

# Check if kubectl is installed
if command -v kubectl &> /dev/null; then
    print_success "kubectl is installed"
else
    print_error "kubectl is not installed"
fi

# Check if kubectl can connect to cluster
if kubectl cluster-info &> /dev/null; then
    print_success "kubectl can connect to Kubernetes cluster"
    CLUSTER_INFO=$(kubectl cluster-info | head -1)
    echo "  Cluster: $CLUSTER_INFO"
else
    print_warning "kubectl cannot connect to Kubernetes cluster"
fi

echo ""

# Check manifest files
REQUIRED_FILES=(
    "namespace.yaml"
    "secret.yaml"
    "deployment.yaml"
    "service.yaml"
    "ingress.yaml"
    "deploy.sh"
    "README.md"
    ".env.template"
    ".gitignore"
)

print_status "Checking manifest files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$SCRIPT_DIR/$file" ]]; then
        print_success "$file exists"
    else
        print_error "$file is missing"
    fi
done

echo ""

# Check environment file
ENV_FILE="$SCRIPT_DIR/.env.$ENVIRONMENT"
print_status "Checking environment configuration..."
if [[ -f "$ENV_FILE" ]]; then
    print_success ".env.$ENVIRONMENT exists"
    
    # Check required variables
    REQUIRED_VARS=("DATABASE_URL" "DATABASE_USERNAME" "DATABASE_PASSWORD" "JWT_SECRET_KEY")
    source "$ENV_FILE"
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -n "${!var}" ]]; then
            print_success "$var is set"
        else
            print_error "$var is not set in .env.$ENVIRONMENT"
        fi
    done
else
    print_warning ".env.$ENVIRONMENT not found"
    print_status "Create it from template: cp .env.template .env.$ENVIRONMENT"
fi

echo ""

# Check deploy script permissions
if [[ -x "$SCRIPT_DIR/deploy.sh" ]]; then
    print_success "deploy.sh is executable"
else
    print_warning "deploy.sh is not executable"
    print_status "Fix with: chmod +x deploy.sh"
fi

echo ""

# Check for Docker image
print_status "Checking Docker image availability..."
if docker images | grep -q "alegon/rabbitmq-admin"; then
    print_success "Docker image alegon/rabbitmq-admin found locally"
else
    print_warning "Docker image alegon/rabbitmq-admin not found locally"
    print_status "Image will be pulled from registry during deployment"
fi

echo ""

# Validate YAML files
print_status "Validating YAML syntax..."
for file in namespace.yaml secret.yaml deployment.yaml service.yaml ingress.yaml; do
    if kubectl apply --dry-run=client -f "$SCRIPT_DIR/$file" &> /dev/null; then
        print_success "$file has valid Kubernetes YAML syntax"
    else
        print_error "$file has invalid YAML syntax"
    fi
done

echo ""
echo "🏁 Validation Complete"
echo ""

if [[ -f "$ENV_FILE" ]] && [[ -x "$SCRIPT_DIR/deploy.sh" ]]; then
    print_success "Ready to deploy! Run: ./deploy.sh $ENVIRONMENT"
else
    print_warning "Complete the setup before deploying:"
    if [[ ! -f "$ENV_FILE" ]]; then
        echo "  1. Create environment file: cp .env.template .env.$ENVIRONMENT"
        echo "  2. Edit configuration: nano .env.$ENVIRONMENT"
    fi
    if [[ ! -x "$SCRIPT_DIR/deploy.sh" ]]; then
        echo "  3. Make deploy script executable: chmod +x deploy.sh"
    fi
fi