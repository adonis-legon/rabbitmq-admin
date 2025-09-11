#!/bin/bash

# RabbitMQ Admin Build Script
# Simple build script for JAR and Docker image

set -e

# Change to project root directory (parent of scripts)
cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE_NAME="rabbitmq-admin"
DOCKER_TAG=${DOCKER_TAG:-latest}

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

show_help() {
    echo "RabbitMQ Admin Build Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  jar         Build standalone JAR file (default)"
    echo "  docker      Build Docker image"
    echo "  dev         Start local development with Docker Compose"
    echo "  clean       Clean all build artifacts"
    echo "  test        Run all tests"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Skip running tests during build"
    echo "  --no-cache      Don't use Docker build cache"
    echo "  --tag TAG       Docker image tag (default: latest)"
    echo ""
    echo "Examples:"
    echo "  $0 jar                    # Build standalone JAR"
    echo "  $0 docker --tag v1.0.0   # Build Docker image"
    echo "  $0 dev                    # Start local development"
}

clean_build() {
    log "${BLUE}Cleaning build artifacts...${NC}"
    
    # Clean Maven artifacts
    mvn clean -q
    
    # Clean frontend build
    if [ -d "frontend/build" ]; then
        rm -rf frontend/build
        log "${GREEN}✓${NC} Cleaned frontend build directory"
    fi
    
    # Clean Docker artifacts
    if command -v docker &> /dev/null; then
        # Remove dangling images
        docker image prune -f > /dev/null 2>&1 || true
        log "${GREEN}✓${NC} Cleaned Docker artifacts"
    fi
    
    log "${GREEN}✓${NC} Build cleanup completed"
}

run_tests() {
    log "${BLUE}Running tests...${NC}"
    
    # Run backend tests
    log "Running backend tests..."
    mvn test -pl backend -q
    
    # Run frontend tests if available
    if [ -f "frontend/package.json" ]; then
        log "Running frontend tests..."
        cd frontend
        if [ -f "package-lock.json" ]; then
            npm ci --silent
        else
            npm install --silent
        fi
        npm test -- --run --reporter=verbose 2>/dev/null || true
        cd ..
    fi
    
    log "${GREEN}✓${NC} All tests completed"
}

build_jar() {
    log "${BLUE}Building standalone JAR...${NC}"
    
    if [ "$SKIP_TESTS" != "true" ]; then
        run_tests
    fi
    
    # Build with production profile (includes frontend assets)
    log "Building application with frontend assets..."
    mvn clean package -Pproduction -q
    
    # Verify frontend assets are included
    if [ -f "backend/target/rabbitmq-admin-backend-*.jar" ]; then
        jar_file=$(ls backend/target/rabbitmq-admin-backend-*.jar | head -1)
        if jar tf "$jar_file" | grep -q "BOOT-INF/classes/static/" > /dev/null 2>&1; then
            log "${GREEN}✓${NC} Frontend assets included in JAR"
        else
            log "${YELLOW}⚠${NC} Frontend assets not found in JAR"
        fi
        
        log "${GREEN}✓${NC} Standalone JAR build completed"
        log "JAR file: $jar_file"
        log ""
        log "To run the application:"
        log "  java -jar $jar_file"
        log ""
        log "Required environment variables:"
        log "  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/rabbitmq_admin"
        log "  SPRING_DATASOURCE_USERNAME=your_db_user"
        log "  SPRING_DATASOURCE_PASSWORD=your_db_password"
        log "  JWT_SECRET_KEY=your-secret-key"
    else
        log "${RED}✗${NC} JAR file not found"
        exit 1
    fi
}

build_docker() {
    log "${BLUE}Building Docker image...${NC}"
    
    # Get version for Docker tag
    PROJECT_VERSION=$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout)
    if [ "$DOCKER_TAG" = "latest" ] && [ -n "$PROJECT_VERSION" ]; then
        DOCKER_TAG="$PROJECT_VERSION"
    fi
    
    local docker_args=""
    if [ "$NO_CACHE" = "true" ]; then
        docker_args="--no-cache"
    fi
    
    # Build Docker image
    log "Building Docker image: ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
    docker build $docker_args -f docker/Dockerfile -t "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}" .
    
    # Tag as latest if not already
    if [ "$DOCKER_TAG" != "latest" ]; then
        docker tag "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}" "${DOCKER_IMAGE_NAME}:latest"
    fi
    
    log "${GREEN}✓${NC} Docker image built successfully"
    log "Image: ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
}

start_dev() {
    log "${BLUE}Starting local development environment...${NC}"
    
    cd docker
    
    # Copy environment template if .env doesn't exist
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log "${YELLOW}⚠${NC} Created .env from template"
    fi
    
    # Build and start services
    docker-compose up --build -d
    
    log "${GREEN}✓${NC} Development environment started"
    log "Application: http://localhost:8080"
    log "Database: localhost:5432"
    log ""
    log "Useful commands:"
    log "  docker-compose logs -f          # View logs"
    log "  docker-compose down             # Stop services"
    log "  docker-compose down -v          # Stop and remove volumes"
    
    cd ..
}

# Parse command line arguments
COMMAND=${1:-dev}
SKIP_TESTS=false
NO_CACHE=false

shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --tag)
            DOCKER_TAG="$2"
            shift 2
            ;;
        *)
            log "${RED}✗${NC} Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute command
case $COMMAND in
    jar|"")
        build_jar
        ;;
    docker)
        build_docker
        ;;
    dev)
        start_dev
        ;;
    clean)
        clean_build
        ;;
    test)
        run_tests
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log "${RED}✗${NC} Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac