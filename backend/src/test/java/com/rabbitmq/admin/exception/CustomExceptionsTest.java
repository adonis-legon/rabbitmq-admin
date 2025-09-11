package com.rabbitmq.admin.exception;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CustomExceptionsTest {

    @Test
    void userNotFoundExceptionShouldCreateCorrectMessage() {
        UserNotFoundException exception = UserNotFoundException.byId("test-id");
        assertEquals("User not found with ID: test-id", exception.getMessage());

        exception = UserNotFoundException.byUsername("testuser");
        assertEquals("User not found with username: testuser", exception.getMessage());
    }

    @Test
    void clusterConnectionNotFoundExceptionShouldCreateCorrectMessage() {
        ClusterConnectionNotFoundException exception = ClusterConnectionNotFoundException.byId("cluster-id");
        assertEquals("Cluster connection not found with ID: cluster-id", exception.getMessage());

        exception = ClusterConnectionNotFoundException.byName("cluster-name");
        assertEquals("Cluster connection not found with name: cluster-name", exception.getMessage());
    }

    @Test
    void duplicateResourceExceptionShouldStoreResourceInfo() {
        DuplicateResourceException exception = DuplicateResourceException.username("testuser");
        assertEquals("Username already exists: testuser", exception.getMessage());
        assertEquals("Username", exception.getResourceType());
        assertEquals("testuser", exception.getResourceIdentifier());

        exception = DuplicateResourceException.clusterName("test-cluster");
        assertEquals("Cluster connection name already exists: test-cluster", exception.getMessage());
        assertEquals("Cluster connection name", exception.getResourceType());
        assertEquals("test-cluster", exception.getResourceIdentifier());
    }

    @Test
    void validationExceptionShouldHandleFieldErrors() {
        ValidationException exception = ValidationException.passwordStrength();
        assertEquals("Validation failed", exception.getMessage());
        assertTrue(exception.getFieldErrors().containsKey("password"));

        exception = ValidationException.emptyField("username");
        assertEquals("Validation failed", exception.getMessage());
        assertEquals("username cannot be empty", exception.getFieldErrors().get("username"));

        Map<String, String> fieldErrors = new HashMap<>();
        fieldErrors.put("field1", "error1");
        fieldErrors.put("field2", "error2");
        exception = new ValidationException("Multiple validation errors", fieldErrors);
        assertEquals("Multiple validation errors", exception.getMessage());
        assertEquals(2, exception.getFieldErrors().size());
        assertEquals("error1", exception.getFieldErrors().get("field1"));
        assertEquals("error2", exception.getFieldErrors().get("field2"));
    }

    @Test
    void clusterConnectionExceptionShouldStoreClusterId() {
        ClusterConnectionException exception = ClusterConnectionException.inactive("cluster-123");
        assertEquals("Cluster connection is not active", exception.getMessage());
        assertEquals("cluster-123", exception.getClusterId());

        RuntimeException cause = new RuntimeException("Connection failed");
        exception = ClusterConnectionException.connectionFailed("cluster-456", cause);
        assertEquals("Failed to connect to cluster", exception.getMessage());
        assertEquals("cluster-456", exception.getClusterId());
        assertEquals(cause, exception.getCause());

        exception = ClusterConnectionException.testFailed("cluster-789", "Invalid credentials");
        assertEquals("Connection test failed: Invalid credentials", exception.getMessage());
        assertEquals("cluster-789", exception.getClusterId());
    }

    @Test
    void rabbitMQApiExceptionShouldStoreClusterIdAndStatusCode() {
        RabbitMQApiException exception = RabbitMQApiException.connectionTimeout("cluster-123");
        assertEquals("Connection timeout to RabbitMQ API", exception.getMessage());
        assertEquals("cluster-123", exception.getClusterId());
        assertEquals(0, exception.getStatusCode());

        exception = RabbitMQApiException.unauthorized("cluster-456");
        assertEquals("Unauthorized access to RabbitMQ API", exception.getMessage());
        assertEquals("cluster-456", exception.getClusterId());
        assertEquals(401, exception.getStatusCode());

        exception = RabbitMQApiException.notFound("cluster-789", "queue/test");
        assertEquals("Resource not found: queue/test", exception.getMessage());
        assertEquals("cluster-789", exception.getClusterId());
        assertEquals(404, exception.getStatusCode());

        exception = RabbitMQApiException.serverError("cluster-999", 500, "Internal server error");
        assertEquals("RabbitMQ API error: Internal server error", exception.getMessage());
        assertEquals("cluster-999", exception.getClusterId());
        assertEquals(500, exception.getStatusCode());
    }

    @Test
    void exceptionsShouldSupportCauseChaining() {
        RuntimeException cause = new RuntimeException("Root cause");

        UserNotFoundException userException = new UserNotFoundException("User error", cause);
        assertEquals("User error", userException.getMessage());
        assertEquals(cause, userException.getCause());

        ClusterConnectionNotFoundException clusterException = new ClusterConnectionNotFoundException("Cluster error",
                cause);
        assertEquals("Cluster error", clusterException.getMessage());
        assertEquals(cause, clusterException.getCause());

        DuplicateResourceException duplicateException = new DuplicateResourceException("Username", "testuser", cause);
        assertEquals("Username already exists: testuser", duplicateException.getMessage());
        assertEquals(cause, duplicateException.getCause());

        ClusterConnectionException connectionException = new ClusterConnectionException("Connection error",
                "cluster-123", cause);
        assertEquals("Connection error", connectionException.getMessage());
        assertEquals("cluster-123", connectionException.getClusterId());
        assertEquals(cause, connectionException.getCause());

        RabbitMQApiException apiException = new RabbitMQApiException("API error", "cluster-456", 500, cause);
        assertEquals("API error", apiException.getMessage());
        assertEquals("cluster-456", apiException.getClusterId());
        assertEquals(500, apiException.getStatusCode());
        assertEquals(cause, apiException.getCause());
    }
}