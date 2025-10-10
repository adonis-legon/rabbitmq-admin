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

print_status "Debug JAR file..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Find the JAR file
JAR_FILE=$(find "$PROJECT_ROOT/backend/target" -name "rabbitmq-admin-*.jar" 2>/dev/null | head -1)

if [ -z "$JAR_FILE" ]; then
    print_status "No JAR file found. Building the application..."
    cd "$PROJECT_ROOT"
    mvn clean package -Pproduction -DskipTests
    JAR_FILE=$(find "$PROJECT_ROOT/backend/target" -name "rabbitmq-admin-*.jar" | head -1)
fi

if [ -z "$JAR_FILE" ]; then
    print_error "Failed to find or build JAR file"
    exit 1
fi

print_status "Found JAR file: $JAR_FILE"
ls -la "$JAR_FILE"

# Check file type
print_status "Checking file type..."
file "$JAR_FILE"

# Check if it contains manifest
print_status "Checking for manifest..."
if unzip -l "$JAR_FILE" | grep -q "META-INF/MANIFEST.MF"; then
    print_success "Manifest found"
    print_status "Manifest contents:"
    unzip -p "$JAR_FILE" META-INF/MANIFEST.MF
else
    print_error "No manifest found!"
    print_status "JAR contents (first 20 files):"
    unzip -l "$JAR_FILE" | head -20
fi

# Try to run with --help to test
print_status "Testing JAR execution..."
if java -jar "$JAR_FILE" --help &>/dev/null; then
    print_success "JAR can be executed successfully"
else
    print_error "JAR execution failed"
    print_status "Trying to get more details..."
    java -jar "$JAR_FILE" --help 2>&1 || true
fi

print_status "Debug completed!"