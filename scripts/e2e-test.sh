#!/bin/bash

# End-to-End Testing Script for RabbitMQ Admin Resource Management
# This script tests the complete resource management functionality with a real RabbitMQ cluster
#
# NOTE: This script is designed for LOCAL TESTING ONLY and is NOT part of the CI/CD pipeline.
# It provides comprehensive end-to-end validation of the resource management features but
# would make CI/CD pipelines too slow and potentially flaky. Use this for:
# - Local development testing
# - Manual deployment validation
# - Pre-release verification
# - Troubleshooting resource management issues

set -e

# Configuration
APP_URL="${APP_URL:-http://localhost:8080}"
RABBITMQ_URL="${RABBITMQ_URL:-http://localhost:15672}"
RABBITMQ_USER="${RABBITMQ_USER:-admin}"
RABBITMQ_PASS="${RABBITMQ_PASS:-admin123}"
TEST_USER="${TEST_USER:-admin}"
TEST_PASS="${TEST_PASS:-admin}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are available
check_dependencies() {
    log_info "Checking dependencies..."
    
    for cmd in curl jq; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    log_success "All dependencies are available"
}

# Wait for services to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 5
        ((attempt++))
    done
    
    log_error "$service_name failed to start within expected time"
    return 1
}

# Setup test data in RabbitMQ
setup_rabbitmq_test_data() {
    log_info "Setting up test data in RabbitMQ..."
    
    # Create test exchanges
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X PUT "$RABBITMQ_URL/api/exchanges/%2F/test-direct-exchange" \
        -H "Content-Type: application/json" \
        -d '{"type":"direct","durable":true,"arguments":{"x-test":"direct-exchange"}}' \
        -s -f || log_warning "Failed to create direct exchange"
    
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X PUT "$RABBITMQ_URL/api/exchanges/%2F/test-topic-exchange" \
        -H "Content-Type: application/json" \
        -d '{"type":"topic","durable":true,"arguments":{"x-test":"topic-exchange"}}' \
        -s -f || log_warning "Failed to create topic exchange"
    
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X PUT "$RABBITMQ_URL/api/exchanges/%2F/test-fanout-exchange" \
        -H "Content-Type: application/json" \
        -d '{"type":"fanout","durable":false,"auto_delete":true}' \
        -s -f || log_warning "Failed to create fanout exchange"
    
    # Create test queues
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X PUT "$RABBITMQ_URL/api/queues/%2F/test-queue-1" \
        -H "Content-Type: application/json" \
        -d '{"durable":true,"arguments":{"x-message-ttl":60000}}' \
        -s -f || log_warning "Failed to create queue 1"
    
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X PUT "$RABBITMQ_URL/api/queues/%2F/test-queue-2" \
        -H "Content-Type: application/json" \
        -d '{"durable":false,"auto_delete":true}' \
        -s -f || log_warning "Failed to create queue 2"
    
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X PUT "$RABBITMQ_URL/api/queues/%2F/test-priority-queue" \
        -H "Content-Type: application/json" \
        -d '{"durable":true,"arguments":{"x-max-priority":10}}' \
        -s -f || log_warning "Failed to create priority queue"
    
    # Create bindings
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X POST "$RABBITMQ_URL/api/bindings/%2F/e/test-direct-exchange/q/test-queue-1" \
        -H "Content-Type: application/json" \
        -d '{"routing_key":"direct.key","arguments":{"x-binding-test":"direct-binding"}}' \
        -s -f || log_warning "Failed to create direct binding"
    
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X POST "$RABBITMQ_URL/api/bindings/%2F/e/test-topic-exchange/q/test-queue-2" \
        -H "Content-Type: application/json" \
        -d '{"routing_key":"topic.*.test"}' \
        -s -f || log_warning "Failed to create topic binding"
    
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X POST "$RABBITMQ_URL/api/bindings/%2F/e/test-fanout-exchange/q/test-priority-queue" \
        -H "Content-Type: application/json" \
        -d '{"routing_key":""}' \
        -s -f || log_warning "Failed to create fanout binding"
    
    # Exchange to exchange binding
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X POST "$RABBITMQ_URL/api/bindings/%2F/e/test-direct-exchange/e/test-topic-exchange" \
        -H "Content-Type: application/json" \
        -d '{"routing_key":"forward.key"}' \
        -s -f || log_warning "Failed to create exchange-to-exchange binding"
    
    log_success "Test data setup completed"
}

# Authenticate and get JWT token
authenticate() {
    log_info "Authenticating with the application..."
    
    local response=$(curl -s -X POST "$APP_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to authenticate"
        return 1
    fi
    
    TOKEN=$(echo "$response" | jq -r '.token')
    
    if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
        log_error "Failed to get authentication token"
        echo "Response: $response"
        return 1
    fi
    
    log_success "Authentication successful"
    return 0
}

# Create test cluster connection
create_cluster_connection() {
    log_info "Creating test cluster connection..."
    
    local response=$(curl -s -X POST "$APP_URL/api/clusters" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"E2E Test Cluster\",
            \"apiUrl\": \"$RABBITMQ_URL\",
            \"username\": \"$RABBITMQ_USER\",
            \"password\": \"$RABBITMQ_PASS\",
            \"description\": \"End-to-End Test Cluster\"
        }")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to create cluster connection"
        return 1
    fi
    
    CLUSTER_ID=$(echo "$response" | jq -r '.id')
    
    if [ "$CLUSTER_ID" = "null" ] || [ -z "$CLUSTER_ID" ]; then
        log_error "Failed to get cluster ID"
        echo "Response: $response"
        return 1
    fi
    
    log_success "Cluster connection created with ID: $CLUSTER_ID"
    return 0
}

# Test resource endpoints
test_connections() {
    log_info "Testing connections endpoint..."
    
    local response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/connections")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to fetch connections"
        return 1
    fi
    
    local total_items=$(echo "$response" | jq -r '.totalItems')
    log_success "Connections endpoint working - found $total_items connections"
    
    # Test pagination
    local paginated_response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/connections?page=0&pageSize=5")
    
    if [ $? -eq 0 ]; then
        log_success "Connections pagination working"
    else
        log_warning "Connections pagination failed"
    fi
    
    return 0
}

test_channels() {
    log_info "Testing channels endpoint..."
    
    local response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/channels")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to fetch channels"
        return 1
    fi
    
    local total_items=$(echo "$response" | jq -r '.totalItems')
    log_success "Channels endpoint working - found $total_items channels"
    
    return 0
}

test_exchanges() {
    log_info "Testing exchanges endpoint..."
    
    local response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/exchanges")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to fetch exchanges"
        return 1
    fi
    
    local total_items=$(echo "$response" | jq -r '.totalItems')
    log_success "Exchanges endpoint working - found $total_items exchanges"
    
    # Test name filtering
    local filtered_response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/exchanges?name=test")
    
    if [ $? -eq 0 ]; then
        local filtered_items=$(echo "$filtered_response" | jq -r '.totalItems')
        log_success "Exchange name filtering working - found $filtered_items test exchanges"
    else
        log_warning "Exchange name filtering failed"
    fi
    
    # Test regex filtering
    local regex_response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/exchanges?name=test.*&useRegex=true")
    
    if [ $? -eq 0 ]; then
        local regex_items=$(echo "$regex_response" | jq -r '.totalItems')
        log_success "Exchange regex filtering working - found $regex_items matching exchanges"
    else
        log_warning "Exchange regex filtering failed"
    fi
    
    return 0
}

test_queues() {
    log_info "Testing queues endpoint..."
    
    local response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/queues")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to fetch queues"
        return 1
    fi
    
    local total_items=$(echo "$response" | jq -r '.totalItems')
    log_success "Queues endpoint working - found $total_items queues"
    
    # Test name filtering
    local filtered_response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/queues?name=test")
    
    if [ $? -eq 0 ]; then
        local filtered_items=$(echo "$filtered_response" | jq -r '.totalItems')
        log_success "Queue name filtering working - found $filtered_items test queues"
    else
        log_warning "Queue name filtering failed"
    fi
    
    return 0
}

test_bindings() {
    log_info "Testing bindings endpoints..."
    
    # Test exchange bindings
    local exchange_bindings=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/exchanges/test-direct-exchange/bindings")
    
    if [ $? -eq 0 ]; then
        local binding_count=$(echo "$exchange_bindings" | jq '. | length')
        log_success "Exchange bindings endpoint working - found $binding_count bindings for test-direct-exchange"
    else
        log_warning "Exchange bindings endpoint failed"
    fi
    
    # Test queue bindings
    local queue_bindings=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/queues/test-queue-1/bindings")
    
    if [ $? -eq 0 ]; then
        local binding_count=$(echo "$queue_bindings" | jq '. | length')
        log_success "Queue bindings endpoint working - found $binding_count bindings for test-queue-1"
    else
        log_warning "Queue bindings endpoint failed"
    fi
    
    return 0
}

# Test error handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test with invalid cluster ID
    local invalid_response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
        "$APP_URL/api/rabbitmq/00000000-0000-0000-0000-000000000000/resources/connections")
    
    local http_code="${invalid_response: -3}"
    if [ "$http_code" = "404" ] || [ "$http_code" = "403" ]; then
        log_success "Error handling for invalid cluster ID working (HTTP $http_code)"
    else
        log_warning "Unexpected response for invalid cluster ID: HTTP $http_code"
    fi
    
    # Test without authentication
    local unauth_response=$(curl -s -w "%{http_code}" \
        "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/connections")
    
    local http_code="${unauth_response: -3}"
    if [ "$http_code" = "401" ]; then
        log_success "Authentication required error handling working (HTTP $http_code)"
    else
        log_warning "Unexpected response for unauthenticated request: HTTP $http_code"
    fi
    
    return 0
}

# Test performance with pagination
test_performance() {
    log_info "Testing performance with different page sizes..."
    
    for page_size in 10 25 50 100; do
        local start_time=$(date +%s%N)
        
        local response=$(curl -s -f -H "Authorization: Bearer $TOKEN" \
            "$APP_URL/api/rabbitmq/$CLUSTER_ID/resources/exchanges?pageSize=$page_size")
        
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ $? -eq 0 ]; then
            log_success "Page size $page_size completed in ${duration}ms"
        else
            log_warning "Page size $page_size failed"
        fi
    done
    
    return 0
}

# Cleanup test data
cleanup_test_data() {
    log_info "Cleaning up test data..."
    
    # Delete test queues
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X DELETE "$RABBITMQ_URL/api/queues/%2F/test-queue-1" -s || true
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X DELETE "$RABBITMQ_URL/api/queues/%2F/test-queue-2" -s || true
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X DELETE "$RABBITMQ_URL/api/queues/%2F/test-priority-queue" -s || true
    
    # Delete test exchanges
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X DELETE "$RABBITMQ_URL/api/exchanges/%2F/test-direct-exchange" -s || true
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X DELETE "$RABBITMQ_URL/api/exchanges/%2F/test-topic-exchange" -s || true
    curl -u "$RABBITMQ_USER:$RABBITMQ_PASS" -X DELETE "$RABBITMQ_URL/api/exchanges/%2F/test-fanout-exchange" -s || true
    
    # Delete cluster connection
    if [ ! -z "$CLUSTER_ID" ] && [ ! -z "$TOKEN" ]; then
        curl -s -X DELETE "$APP_URL/api/clusters/$CLUSTER_ID" \
            -H "Authorization: Bearer $TOKEN" || true
    fi
    
    log_success "Cleanup completed"
}

# Main execution
main() {
    log_info "Starting End-to-End Resource Management Tests"
    log_info "Application URL: $APP_URL"
    log_info "RabbitMQ URL: $RABBITMQ_URL"
    
    # Setup trap for cleanup
    trap cleanup_test_data EXIT
    
    # Run tests
    check_dependencies
    wait_for_service "$APP_URL/actuator/health" "Application"
    wait_for_service "$RABBITMQ_URL/api/overview" "RabbitMQ Management API"
    
    setup_rabbitmq_test_data
    authenticate
    create_cluster_connection
    
    # Run resource tests
    test_connections
    test_channels
    test_exchanges
    test_queues
    test_bindings
    
    # Run additional tests
    test_error_handling
    test_performance
    
    log_success "All End-to-End tests completed successfully!"
}

# Run main function
main "$@"