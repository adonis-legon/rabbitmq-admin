package com.rabbitmq.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@ExtendWith(MockitoExtension.class)
class ResourceAuditServiceTest {

    @Mock
    private ObjectMapper objectMapper;

    private ResourceAuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new ResourceAuditService(new ObjectMapper());
        MDC.clear();
    }

    @Test
    void shouldLogResourceAccess() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "connections";
        String operation = "list";
        Map<String, Object> parameters = Map.of("page", 1, "pageSize", 50);

        // When & Then
        assertDoesNotThrow(
                () -> auditService.logResourceAccess(username, clusterId, resourceType, operation, parameters));
    }

    @Test
    void shouldLogResourceAccessFailure() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "channels";
        String operation = "list";
        String errorMessage = "Connection timeout";
        String errorType = "TimeoutException";

        // When & Then
        assertDoesNotThrow(() -> auditService.logResourceAccessFailure(username, clusterId, resourceType, operation,
                errorMessage, errorType));
    }

    @Test
    void shouldLogClusterConnectivityIssue() {
        // Given
        UUID clusterId = UUID.randomUUID();
        String clusterName = "test-cluster";
        String errorMessage = "Connection refused";
        String errorType = "ConnectionException";
        String username = "testuser";

        // When & Then
        assertDoesNotThrow(() -> auditService.logClusterConnectivityIssue(clusterId, clusterName, errorMessage,
                errorType, username));
    }

    @Test
    void shouldLogAuthenticationFailure() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "exchanges";
        String operation = "list";
        String errorMessage = "Invalid credentials";

        // When & Then
        assertDoesNotThrow(() -> auditService.logAuthenticationFailure(username, clusterId, resourceType, operation,
                errorMessage));
    }

    @Test
    void shouldLogAuthorizationFailure() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "queues";
        String operation = "list";
        String errorMessage = "Access denied";

        // When & Then
        assertDoesNotThrow(
                () -> auditService.logAuthorizationFailure(username, clusterId, resourceType, operation, errorMessage));
    }

    @Test
    void shouldLogUnusualAccessPattern() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String pattern = "rapid_successive_requests";
        Map<String, Object> details = Map.of("requestCount", 100, "timeWindow", "1 minute");

        // When & Then
        assertDoesNotThrow(() -> auditService.logUnusualAccessPattern(username, clusterId, pattern, details));
    }

    @Test
    void shouldLogPerformanceIssue() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "bindings";
        String operation = "exchange_bindings";
        long responseTimeMs = 5000;
        String threshold = "2000ms";

        // When & Then
        assertDoesNotThrow(() -> auditService.logPerformanceIssue(username, clusterId, resourceType, operation,
                responseTimeMs, threshold));
    }

    @Test
    void shouldLogRateLimitingEvent() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "connections";
        String operation = "list";
        int requestCount = 50;
        String timeWindow = "1 minute";

        // When & Then
        assertDoesNotThrow(() -> auditService.logRateLimitingEvent(username, clusterId, resourceType, operation,
                requestCount, timeWindow));
    }

    @Test
    void shouldIncludeMDCContextInAuditLogs() {
        // Given
        MDC.put("requestId", "req-123");
        MDC.put("sessionId", "sess-456");
        MDC.put("clientIp", "192.168.1.100");

        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "connections";
        String operation = "list";
        Map<String, Object> parameters = Map.of("page", 1);

        // When & Then
        assertDoesNotThrow(
                () -> auditService.logResourceAccess(username, clusterId, resourceType, operation, parameters));

        // Cleanup
        MDC.clear();
    }

    @Test
    void shouldHandleNullClusterId() {
        // Given
        String username = "testuser";
        UUID clusterId = null;
        String resourceType = "connections";
        String operation = "list";
        Map<String, Object> parameters = Map.of("page", 1);

        // When & Then
        assertDoesNotThrow(
                () -> auditService.logResourceAccess(username, clusterId, resourceType, operation, parameters));
    }

    @Test
    void shouldHandleEmptyParameters() {
        // Given
        String username = "testuser";
        UUID clusterId = UUID.randomUUID();
        String resourceType = "connections";
        String operation = "list";
        Map<String, Object> parameters = Map.of();

        // When & Then
        assertDoesNotThrow(
                () -> auditService.logResourceAccess(username, clusterId, resourceType, operation, parameters));
    }
}