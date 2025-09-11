#!/bin/bash

# RabbitMQ Admin Container Deployment Script
# Simple deployment script for containerized environments

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
DEFAULT_TAG="latest"

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

show_help() {
    echo "RabbitMQ Admin Container Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  run         Run the container with external database"
    echo "  stop        Stop running container"
    echo "  logs        View container logs"
    echo "  status      Check container status"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  --image IMAGE       Docker image (default: rabbitmq-admin:latest)"
    echo "  --port PORT         Application port (default: 8080)"
    echo "  --db-url URL        Database URL (required)"
    echo "  --db-user USER      Database username (required)"
    echo "  --db-pass PASS      Database password (required)"
    echo "  --jwt-secret KEY    JWT secret key (required)"
    echo "  --name NAME         Container name (default: rabbitmq-admin)"
    echo ""
    echo "Examples:"
    echo "  $0 run --db-url jdbc:postgresql://db:5432/rabbitmq_admin \\"
    echo "         --db-user admin --db-pass secret --jwt-secret my-secret"
    echo ""
    echo "  $0 run --image myregistry/rabbitmq-admin:v1.0.0 \\"
    echo "         --db-url jdbc:postgresql://localhost:5432/rabbitmq_admin \\"
    echo "         --db-user rabbitmq_admin --db-pass password \\"
    echo "         --jwt-secret production-secret-key"
}

run_container() {
    log "${BLUE}Running RabbitMQ Admin container...${NC}"
    
    # Validate required parameters
    if [ -z "$DB_URL" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$JWT_SECRET" ]; then
        log "${RED}✗${NC} Missing required parameters"
        log "Required: --db-url, --db-user, --db-pass, --jwt-secret"
        exit 1
    fi
    
    # Stop existing container if running
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log "Stopping existing container..."
        docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
        docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
    fi
    
    # Run the container
    log "Starting container: $CONTAINER_NAME"
    log "Image: $DOCKER_IMAGE"
    log "Port: $APP_PORT"
    log "Database: $DB_URL"
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$APP_PORT:8080" \
        -e SPRING_DATASOURCE_URL="$DB_URL" \
        -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
        -e SPRING_DATASOURCE_PASSWORD="$DB_PASS" \
        -e JWT_SECRET_KEY="$JWT_SECRET" \
        -e SPRING_PROFILES_ACTIVE=production \
        --restart unless-stopped \
        "$DOCKER_IMAGE"
    
    # Wait for container to be ready
    log "Waiting for application to start..."
    sleep 10
    
    # Check if container is running
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log "${GREEN}✓${NC} Container started successfully"
        log "Application: http://localhost:$APP_PORT"
        log ""
        log "Useful commands:"
        log "  $0 logs                         # View logs"
        log "  $0 status                       # Check status"
        log "  $0 stop                         # Stop container"
        log "  docker exec -it $CONTAINER_NAME sh  # Access container shell"
    else
        log "${RED}✗${NC} Container failed to start"
        log "Check logs with: docker logs $CONTAINER_NAME"
        exit 1
    fi
}

stop_container() {
    log "${BLUE}Stopping RabbitMQ Admin container...${NC}"
    
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        log "${GREEN}✓${NC} Container stopped and removed"
    else
        log "${YELLOW}⚠${NC} Container is not running"
    fi
}

show_logs() {
    log "${BLUE}Showing container logs...${NC}"
    
    if docker ps -a -q -f name="$CONTAINER_NAME" | grep -q .; then
        docker logs -f "$CONTAINER_NAME"
    else
        log "${RED}✗${NC} Container not found: $CONTAINER_NAME"
        exit 1
    fi
}

show_status() {
    log "${BLUE}Checking container status...${NC}"
    
    if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        log "${GREEN}✓${NC} Container is running"
        docker ps -f name="$CONTAINER_NAME"
        
        # Check health if possible
        if curl -s -f "http://localhost:$APP_PORT/actuator/health" > /dev/null 2>&1; then
            log "${GREEN}✓${NC} Application health check passed"
        else
            log "${YELLOW}⚠${NC} Application health check failed"
        fi
    elif docker ps -a -q -f name="$CONTAINER_NAME" | grep -q .; then
        log "${RED}✗${NC} Container exists but is not running"
        docker ps -a -f name="$CONTAINER_NAME"
    else
        log "${YELLOW}⚠${NC} Container not found: $CONTAINER_NAME"
    fi
}

# Parse command line arguments
COMMAND=${1:-help}
DOCKER_IMAGE="$DOCKER_IMAGE_NAME:$DEFAULT_TAG"
APP_PORT=8080
CONTAINER_NAME="rabbitmq-admin"
DB_URL=""
DB_USER=""
DB_PASS=""
JWT_SECRET=""

shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --image)
            DOCKER_IMAGE="$2"
            shift 2
            ;;
        --port)
            APP_PORT="$2"
            shift 2
            ;;
        --db-url)
            DB_URL="$2"
            shift 2
            ;;
        --db-user)
            DB_USER="$2"
            shift 2
            ;;
        --db-pass)
            DB_PASS="$2"
            shift 2
            ;;
        --jwt-secret)
            JWT_SECRET="$2"
            shift 2
            ;;
        --name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        *)
            log "${RED}✗${NC} Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check Docker
if ! command -v docker &> /dev/null; then
    log "${RED}✗${NC} Docker is not installed"
    exit 1
fi

if ! docker info &> /dev/null; then
    log "${RED}✗${NC} Docker daemon is not running"
    exit 1
fi

# Execute command
case $COMMAND in
    run)
        run_container
        ;;
    stop)
        stop_container
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
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