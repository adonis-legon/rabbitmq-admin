#!/bin/bash

set -e

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Testing logback configuration with docker profile..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Find the JAR file
JAR_FILE=$(find "$PROJECT_ROOT/backend/target" -name "rabbitmq-admin-*.jar" 2>/dev/null | head -1)

if [ -z "$JAR_FILE" ]; then
    print_error "No JAR file found. Please build the application first."
    exit 1
fi

print_status "Found JAR file: $JAR_FILE"

# Create temporary dockerfile for testing
TEMP_DIR=$(mktemp -d)
print_status "Using temporary directory: $TEMP_DIR"

# Copy JAR to temp directory
cp "$JAR_FILE" "$TEMP_DIR/"

# Create simple Dockerfile for testing
cat > "$TEMP_DIR/Dockerfile" << 'EOF'
FROM gcr.io/distroless/java21-debian12:nonroot

WORKDIR /app
COPY rabbitmq-admin-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-jar", "app.jar"]
EOF

# Build test image
print_status "Building test Docker image..."
cd "$TEMP_DIR"
docker build -t rabbitmq-admin-logback-test:latest .

# Test with docker profile
print_status "Testing with docker profile (should work without file logging errors)..."
docker run --rm \
    -e SPRING_PROFILES_ACTIVE=docker \
    -e SPRING_DATASOURCE_URL=jdbc:postgresql://nonexistent:5432/test \
    -e SPRING_DATASOURCE_USERNAME=test \
    -e SPRING_DATASOURCE_PASSWORD=test \
    -e JWT_SECRET_KEY=test-secret-key-that-is-long-enough-for-jwt-validation-and-security-requirements \
    --name rabbitmq-admin-logback-test \
    rabbitmq-admin-logback-test:latest &

# Give it a few seconds to start and show logs
sleep 10

# Get container logs
print_status "Container logs:"
docker logs rabbitmq-admin-logback-test

# Stop the container
docker stop rabbitmq-admin-logback-test || true

# Cleanup
print_status "Cleaning up..."
docker rmi rabbitmq-admin-logback-test:latest || true
rm -rf "$TEMP_DIR"

print_success "Test completed!"