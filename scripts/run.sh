#!/bin/bash

# Simple run script for RabbitMQ Admin
# Helps run the application locally with different configurations

set -e

# Change to project root directory (parent of scripts)
cd "$(dirname "$0")/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_help() {
    echo "RabbitMQ Admin Run Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  jar         Run standalone JAR (requires external database)"
    echo "  docker      Run with Docker (includes database)"
    echo "  container   Run published Docker image (requires external database)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 jar                    # Run JAR with environment variables"
    echo "  $0 docker                 # Run with Docker Compose (local dev)"
    echo "  $0 container              # Run published container image"
}

run_jar() {
    echo -e "${GREEN}Running standalone JAR...${NC}"
    
    # Check if JAR exists
    if [ ! -f backend/target/rabbitmq-admin-backend-*.jar ]; then
        echo -e "${YELLOW}JAR not found. Building...${NC}"
        ./scripts/build.sh jar
    fi
    
    # Check required environment variables
    if [ -z "$SPRING_DATASOURCE_URL" ] || [ -z "$SPRING_DATASOURCE_USERNAME" ] || [ -z "$SPRING_DATASOURCE_PASSWORD" ] || [ -z "$JWT_SECRET_KEY" ]; then
        echo -e "${RED}Missing required environment variables:${NC}"
        echo "  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/rabbitmq_admin"
        echo "  SPRING_DATASOURCE_USERNAME=your_user"
        echo "  SPRING_DATASOURCE_PASSWORD=your_password"
        echo "  JWT_SECRET_KEY=your-secret-key"
        echo ""
        echo "Set them and try again, or use './run.sh docker' for local development"
        exit 1
    fi
    
    # Run the JAR
    java -jar backend/target/rabbitmq-admin-backend-*.jar
}

run_docker() {
    echo -e "${GREEN}Running with Docker Compose (local development)...${NC}"
    
    cd docker
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}Created .env file from template${NC}"
    fi
    
    # Start services
    docker-compose up --build
    
    cd ..
}

run_container() {
    echo -e "${GREEN}Running published Docker image...${NC}"
    
    # Check required parameters
    if [ -z "$DB_URL" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}Missing required environment variables:${NC}"
        echo "  DB_URL=jdbc:postgresql://your-db:5432/rabbitmq_admin"
        echo "  DB_USER=your_user"
        echo "  DB_PASS=your_password"
        echo "  JWT_SECRET=your-secret-key"
        echo ""
        echo "Example:"
        echo "  DB_URL=jdbc:postgresql://localhost:5432/rabbitmq_admin \\"
        echo "  DB_USER=rabbitmq_admin \\"
        echo "  DB_PASS=password \\"
        echo "  JWT_SECRET=my-secret-key \\"
        echo "  $0 container"
        exit 1
    fi
    
    # Run container
    docker run -d \
        --name rabbitmq-admin \
        -p 8080:8080 \
        -e SPRING_DATASOURCE_URL="$DB_URL" \
        -e SPRING_DATASOURCE_USERNAME="$DB_USER" \
        -e SPRING_DATASOURCE_PASSWORD="$DB_PASS" \
        -e JWT_SECRET_KEY="$JWT_SECRET" \
        --restart unless-stopped \
        rabbitmq-admin:latest
    
    echo -e "${GREEN}Container started successfully!${NC}"
    echo "Application: http://localhost:8080"
}

# Parse command
COMMAND=${1:-help}

case $COMMAND in
    jar)
        run_jar
        ;;
    docker)
        run_docker
        ;;
    container)
        run_container
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac