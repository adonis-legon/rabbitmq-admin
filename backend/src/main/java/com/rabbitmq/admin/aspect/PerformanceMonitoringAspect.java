package com.rabbitmq.admin.aspect;

import com.rabbitmq.admin.config.MonitoringProperties;
import com.rabbitmq.admin.service.ResourceAuditService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Aspect for monitoring performance of resource operations.
 * Automatically logs slow operations and performance issues.
 */
@Aspect
@Component
public class PerformanceMonitoringAspect {

    private static final Logger performanceLogger = LoggerFactory.getLogger("PERFORMANCE");
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringAspect.class);

    private final ResourceAuditService auditService;
    private final MonitoringProperties monitoringProperties;

    public PerformanceMonitoringAspect(ResourceAuditService auditService, MonitoringProperties monitoringProperties) {
        this.auditService = auditService;
        this.monitoringProperties = monitoringProperties;
    }

    /**
     * Monitor performance of resource service methods.
     */
    @Around("execution(* com.rabbitmq.admin.service.RabbitMQResourceService.*(..))")
    public Object monitorResourceServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorMethodPerformance(joinPoint, "ResourceService");
    }

    /**
     * Monitor performance of resource controller methods.
     */
    @Around("execution(* com.rabbitmq.admin.controller.RabbitMQResourceController.*(..))")
    public Object monitorResourceControllerPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorMethodPerformance(joinPoint, "ResourceController");
    }

    /**
     * Monitor performance of cluster health service methods.
     */
    @Around("execution(* com.rabbitmq.admin.service.RabbitMQClusterHealthService.*(..))")
    public Object monitorHealthServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return monitorMethodPerformance(joinPoint, "HealthService");
    }

    private Object monitorMethodPerformance(ProceedingJoinPoint joinPoint, String serviceType) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        Instant startTime = Instant.now();

        try {
            Object result = joinPoint.proceed();

            Duration duration = Duration.between(startTime, Instant.now());
            long durationMs = duration.toMillis();

            // Log performance metrics
            logPerformanceMetrics(serviceType, className, methodName, durationMs, true, null);

            // Check for performance issues
            long criticalThreshold = monitoringProperties.getPerformance().getCriticalThresholdMs();
            long slowThreshold = monitoringProperties.getPerformance().getSlowThresholdMs();

            if (durationMs > criticalThreshold) {
                handleCriticalPerformanceIssue(joinPoint, serviceType, className, methodName, durationMs);
            } else if (durationMs > slowThreshold) {
                handleSlowPerformanceIssue(joinPoint, serviceType, className, methodName, durationMs);
            }

            return result;

        } catch (Throwable throwable) {
            Duration duration = Duration.between(startTime, Instant.now());
            long durationMs = duration.toMillis();

            // Log performance metrics for failed operations
            logPerformanceMetrics(serviceType, className, methodName, durationMs, false, throwable.getMessage());

            throw throwable;
        }
    }

    private void logPerformanceMetrics(String serviceType, String className, String methodName,
            long durationMs, boolean success, String errorMessage) {
        try {
            String logMessage = String.format(
                    "PERFORMANCE_METRIC: service=%s, class=%s, method=%s, duration=%dms, success=%s%s",
                    serviceType, className, methodName, durationMs, success,
                    errorMessage != null ? ", error=" + errorMessage : "");

            performanceLogger.info(logMessage);

            long slowThreshold = monitoringProperties.getPerformance().getSlowThresholdMs();
            if (durationMs > slowThreshold) {
                logger.warn("Slow operation detected: {}.{} took {}ms", className, methodName, durationMs);
            }

        } catch (Exception e) {
            logger.error("Failed to log performance metrics", e);
        }
    }

    private void handleSlowPerformanceIssue(ProceedingJoinPoint joinPoint, String serviceType,
            String className, String methodName, long durationMs) {
        try {
            // Extract user and cluster information if available
            String username = extractUsername(joinPoint);
            UUID clusterId = extractClusterId(joinPoint);
            String resourceType = extractResourceType(methodName);

            long slowThreshold = monitoringProperties.getPerformance().getSlowThresholdMs();

            if (username != null && clusterId != null) {
                auditService.logPerformanceIssue(
                        username, clusterId, resourceType, methodName, durationMs,
                        "slow_threshold=" + slowThreshold + "ms");
            }

            logger.warn("SLOW_OPERATION: {}.{} took {}ms (threshold: {}ms)",
                    className, methodName, durationMs, slowThreshold);

        } catch (Exception e) {
            logger.error("Failed to handle slow performance issue", e);
        }
    }

    private void handleCriticalPerformanceIssue(ProceedingJoinPoint joinPoint, String serviceType,
            String className, String methodName, long durationMs) {
        try {
            // Extract user and cluster information if available
            String username = extractUsername(joinPoint);
            UUID clusterId = extractClusterId(joinPoint);
            String resourceType = extractResourceType(methodName);

            long criticalThreshold = monitoringProperties.getPerformance().getCriticalThresholdMs();

            if (username != null && clusterId != null) {
                auditService.logPerformanceIssue(
                        username, clusterId, resourceType, methodName, durationMs,
                        "critical_threshold=" + criticalThreshold + "ms");
            }

            logger.error("CRITICAL_PERFORMANCE: {}.{} took {}ms (threshold: {}ms)",
                    className, methodName, durationMs, criticalThreshold);

        } catch (Exception e) {
            logger.error("Failed to handle critical performance issue", e);
        }
    }

    private String extractUsername(ProceedingJoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            for (Object arg : args) {
                if (arg != null && arg.getClass().getSimpleName().equals("User")) {
                    // Use reflection to get username
                    return (String) arg.getClass().getMethod("getUsername").invoke(arg);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract username from method arguments", e);
        }
        return null;
    }

    private UUID extractClusterId(ProceedingJoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            for (Object arg : args) {
                if (arg instanceof UUID) {
                    return (UUID) arg;
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract cluster ID from method arguments", e);
        }
        return null;
    }

    private String extractResourceType(String methodName) {
        if (methodName.contains("Connection"))
            return "connections";
        if (methodName.contains("Channel"))
            return "channels";
        if (methodName.contains("Exchange"))
            return "exchanges";
        if (methodName.contains("Queue"))
            return "queues";
        if (methodName.contains("Binding"))
            return "bindings";
        return "unknown";
    }
}