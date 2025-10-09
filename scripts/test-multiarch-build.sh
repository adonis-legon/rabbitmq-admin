#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Testing multi-architecture Docker build..."

# Check if Docker BuildKit is enabled
if ! docker buildx version &> /dev/null; then
    print_error "Docker BuildKit is not available. Please ensure Docker Desktop is updated."
    exit 1
fi

# Check if required JAR exists
JAR_FILE=$(find "$PROJECT_ROOT/backend/target" -name "rabbitmq-admin-*.jar" 2>/dev/null | head -1)
if [ -z "$JAR_FILE" ]; then
    print_warning "No JAR file found. Building the application first..."
    cd "$PROJECT_ROOT"
    mvn clean package -Pproduction -DskipTests
    JAR_FILE=$(find "$PROJECT_ROOT/backend/target" -name "rabbitmq-admin-*.jar" | head -1)
    
    if [ -z "$JAR_FILE" ]; then
        print_error "Failed to build JAR file"
        exit 1
    fi
fi

# Create temporary docker directory
TEMP_DOCKER_DIR=$(mktemp -d)
print_status "Using temporary directory: $TEMP_DOCKER_DIR"

# Copy Dockerfile and JAR
cp "$PROJECT_ROOT/docker/Dockerfile.release" "$TEMP_DOCKER_DIR/"
cp "$JAR_FILE" "$TEMP_DOCKER_DIR/"

# Extract version for tagging
cd "$PROJECT_ROOT"
VERSION=$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout)
IMAGE_NAME="rabbitmq-admin-test:$VERSION"

print_status "Building multi-architecture image: $IMAGE_NAME"

# Create buildx builder if it doesn't exist
if ! docker buildx ls | grep -q "multiarch-builder"; then
    print_status "Creating multiarch builder..."
    docker buildx create --name multiarch-builder --use
fi

# Build for multiple architectures
cd "$TEMP_DOCKER_DIR"
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "$IMAGE_NAME" \
    --load \
    .

if [ $? -eq 0 ]; then
    print_success "Multi-architecture build completed successfully!"
    print_status "Image created: $IMAGE_NAME"
    
    # Show image details
    print_status "Image details:"
    docker image inspect "$IMAGE_NAME" --format '{{.Architecture}}' 2>/dev/null || echo "Image inspection failed"
    
    print_status "You can test the image with:"
    echo "  docker run --rm -p 8080:8080 -e SPRING_PROFILES_ACTIVE=test $IMAGE_NAME"
else
    print_error "Multi-architecture build failed!"
    exit 1
fi

# Cleanup
print_status "Cleaning up temporary directory..."
rm -rf "$TEMP_DOCKER_DIR"

print_success "Test completed!"