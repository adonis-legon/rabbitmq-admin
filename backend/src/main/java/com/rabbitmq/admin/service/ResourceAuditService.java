package com.rabbitmq.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for audit logging of RabbitMQ resource access attempts and patterns.
 * Provides comprehensive logging for security monitoring and usage analysis.
 */
@Service
public class ResourceAuditService {

    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT." + ResourceAuditService.class.getName());
    private static final Logger logger = LoggerFactory.getLogger(ResourceAuditService.class);

    private final ObjectMapper objectMapper;

    public ResourceAuditService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Logs a successful resource access attempt.
     */
    public void logResourceAccess(String username, UUID clusterId, String resourceType,
            String operation, Map<String, Object> parameters) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "RESOURCE_ACCESS", username, clusterId, resourceType, operation, true, null);
            auditEvent.put("parameters", parameters);

            logAuditEvent(auditEvent);

            logger.debug("Logged successful resource access: user={}, cluster={}, resource={}, operation={}",
                    username, clusterId, resourceType, operation);
        } catch (Exception e) {
            logger.error("Failed to log resource access audit event", e);
        }
    }

    /**
     * Logs a failed resource access attempt.
     */
    public void logResourceAccessFailure(String username, UUID clusterId, String resourceType,
            String operation, String errorMessage, String errorType) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "RESOURCE_ACCESS_FAILURE", username, clusterId, resourceType, operation, false, errorMessage);
            auditEvent.put("errorType", errorType);

            logAuditEvent(auditEvent);

            logger.warn("Logged failed resource access: user={}, cluster={}, resource={}, operation={}, error={}",
                    username, clusterId, resourceType, operation, errorMessage);
        } catch (Exception e) {
            logger.error("Failed to log resource access failure audit event", e);
        }
    }

    /**
     * Logs cluster connectivity issues.
     */
    public void logClusterConnectivityIssue(UUID clusterId, String clusterName, String errorMessage,
            String errorType, String username) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "CLUSTER_CONNECTIVITY_ISSUE", username, clusterId, "cluster", "connectivity_check", false,
                    errorMessage);
            auditEvent.put("clusterName", clusterName);
            auditEvent.put("errorType", errorType);

            logAuditEvent(auditEvent);

            logger.warn("Logged cluster connectivity issue: cluster={} ({}), error={}",
                    clusterId, clusterName, errorMessage);
        } catch (Exception e) {
            logger.error("Failed to log cluster connectivity audit event", e);
        }
    }

    /**
     * Logs authentication failures during resource access.
     */
    public void logAuthenticationFailure(String username, UUID clusterId, String resourceType,
            String operation, String errorMessage) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "AUTHENTICATION_FAILURE", username, clusterId, resourceType, operation, false, errorMessage);
            auditEvent.put("securityEvent", true);

            logAuditEvent(auditEvent);

            logger.warn("Logged authentication failure: user={}, cluster={}, resource={}, operation={}, error={}",
                    username, clusterId, resourceType, operation, errorMessage);
        } catch (Exception e) {
            logger.error("Failed to log authentication failure audit event", e);
        }
    }

    /**
     * Logs authorization failures during resource access.
     */
    public void logAuthorizationFailure(String username, UUID clusterId, String resourceType,
            String operation, String errorMessage) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "AUTHORIZATION_FAILURE", username, clusterId, resourceType, operation, false, errorMessage);
            auditEvent.put("securityEvent", true);

            logAuditEvent(auditEvent);

            logger.warn("Logged authorization failure: user={}, cluster={}, resource={}, operation={}, error={}",
                    username, clusterId, resourceType, operation, errorMessage);
        } catch (Exception e) {
            logger.error("Failed to log authorization failure audit event", e);
        }
    }

    /**
     * Logs unusual access patterns that might indicate suspicious activity.
     */
    public void logUnusualAccessPattern(String username, UUID clusterId, String pattern,
            Map<String, Object> details) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "UNUSUAL_ACCESS_PATTERN", username, clusterId, "pattern", "detection", false,
                    "Unusual access pattern detected: " + pattern);
            auditEvent.put("pattern", pattern);
            auditEvent.put("details", details);
            auditEvent.put("securityEvent", true);

            logAuditEvent(auditEvent);

            logger.warn("Logged unusual access pattern: user={}, cluster={}, pattern={}",
                    username, clusterId, pattern);
        } catch (Exception e) {
            logger.error("Failed to log unusual access pattern audit event", e);
        }
    }

    /**
     * Logs performance issues during resource operations.
     */
    public void logPerformanceIssue(String username, UUID clusterId, String resourceType,
            String operation, long responseTimeMs, String threshold) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "PERFORMANCE_ISSUE", username, clusterId, resourceType, operation, true,
                    "Slow response time detected");
            auditEvent.put("responseTimeMs", responseTimeMs);
            auditEvent.put("threshold", threshold);

            logAuditEvent(auditEvent);

            logger.warn("Logged performance issue: user={}, cluster={}, resource={}, operation={}, responseTime={}ms",
                    username, clusterId, resourceType, operation, responseTimeMs);
        } catch (Exception e) {
            logger.error("Failed to log performance issue audit event", e);
        }
    }

    /**
     * Logs rate limiting events.
     */
    public void logRateLimitingEvent(String username, UUID clusterId, String resourceType,
            String operation, int requestCount, String timeWindow) {
        try {
            Map<String, Object> auditEvent = createBaseAuditEvent(
                    "RATE_LIMITING", username, clusterId, resourceType, operation, false,
                    "Rate limit exceeded");
            auditEvent.put("requestCount", requestCount);
            auditEvent.put("timeWindow", timeWindow);
            auditEvent.put("securityEvent", true);

            logAuditEvent(auditEvent);

            logger.warn("Logged rate limiting event: user={}, cluster={}, resource={}, operation={}, requests={}/{}",
                    username, clusterId, resourceType, operation, requestCount, timeWindow);
        } catch (Exception e) {
            logger.error("Failed to log rate limiting audit event", e);
        }
    }

    private Map<String, Object> createBaseAuditEvent(String eventType, String username, UUID clusterId,
            String resourceType, String operation, boolean success,
            String errorMessage) {
        Map<String, Object> auditEvent = new HashMap<>();
        auditEvent.put("timestamp", Instant.now().toString());
        auditEvent.put("eventType", eventType);
        auditEvent.put("username", username);
        auditEvent.put("clusterId", clusterId != null ? clusterId.toString() : null);
        auditEvent.put("resourceType", resourceType);
        auditEvent.put("operation", operation);
        auditEvent.put("success", success);

        if (errorMessage != null) {
            auditEvent.put("errorMessage", errorMessage);
        }

        // Add request context if available
        String requestId = MDC.get("requestId");
        if (requestId != null) {
            auditEvent.put("requestId", requestId);
        }

        String sessionId = MDC.get("sessionId");
        if (sessionId != null) {
            auditEvent.put("sessionId", sessionId);
        }

        String clientIp = MDC.get("clientIp");
        if (clientIp != null) {
            auditEvent.put("clientIp", clientIp);
        }

        return auditEvent;
    }

    private void logAuditEvent(Map<String, Object> auditEvent) {
        try {
            String jsonEvent = objectMapper.writeValueAsString(auditEvent);
            auditLogger.info(jsonEvent);
        } catch (Exception e) {
            logger.error("Failed to serialize audit event to JSON", e);
            // Fallback to simple string logging
            auditLogger.info("AUDIT_EVENT: {}", auditEvent.toString());
        }
    }
}