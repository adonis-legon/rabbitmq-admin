package com.rabbitmq.admin.aspect;

import com.rabbitmq.admin.model.AuditOperationStatus;
import com.rabbitmq.admin.model.AuditOperationType;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.service.WriteAuditService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Aspect for intercepting and auditing write operations marked
 * with @AuditWriteOperation.
 * This aspect captures operation details, success/failure status, timing
 * information,
 * and ensures that audit failures do not interfere with the original operation
 * execution.
 */
@Aspect
@Component
@ConditionalOnProperty(name = "app.audit.write-operations.enabled", havingValue = "true", matchIfMissing = false)
public class WriteOperationAuditAspect {

    private static final Logger logger = LoggerFactory.getLogger(WriteOperationAuditAspect.class);

    private final WriteAuditService writeAuditService;
    private final ClusterConnectionRepository clusterConnectionRepository;

    public WriteOperationAuditAspect(WriteAuditService writeAuditService,
            ClusterConnectionRepository clusterConnectionRepository) {
        this.writeAuditService = writeAuditService;
        this.clusterConnectionRepository = clusterConnectionRepository;
        logger.info("WriteOperationAuditAspect initialized - audit logging enabled");
    }

    /**
     * Intercepts methods annotated with @AuditWriteOperation and performs audit
     * logging.
     * The aspect captures operation details before execution, monitors the
     * execution,
     * and logs the results regardless of success or failure.
     */
    @Around("@annotation(AuditWriteOperation)")
    public Object auditWriteOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AuditWriteOperation annotation = method.getAnnotation(AuditWriteOperation.class);

        if (annotation == null) {
            logger.warn("AuditWriteOperation annotation not found on method: {}", method.getName());
            return joinPoint.proceed();
        }

        Instant startTime = Instant.now();
        String methodName = method.getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();

        // Extract operation details from annotation
        AuditOperationType operationType = annotation.operationType();
        String resourceType = annotation.resourceType();
        String description = annotation.description();

        logger.debug("Intercepting write operation: {}.{} - {} on {}",
                className, methodName, operationType, resourceType);

        try {
            // Execute the original method
            Object result = joinPoint.proceed();

            // Calculate execution time
            Duration executionTime = Duration.between(startTime, Instant.now());

            // Audit successful operation
            auditOperation(joinPoint, annotation, operationType, resourceType, description,
                    AuditOperationStatus.SUCCESS, null, executionTime, result);

            logger.debug("Successfully audited write operation: {}.{} - {} completed in {}ms",
                    className, methodName, operationType, executionTime.toMillis());

            return result;

        } catch (Throwable throwable) {
            // Calculate execution time for failed operation
            Duration executionTime = Duration.between(startTime, Instant.now());

            // Audit failed operation
            auditOperation(joinPoint, annotation, operationType, resourceType, description,
                    AuditOperationStatus.FAILURE, throwable.getMessage(), executionTime, null);

            logger.debug("Audited failed write operation: {}.{} - {} failed after {}ms with error: {}",
                    className, methodName, operationType, executionTime.toMillis(), throwable.getMessage());

            // Re-throw the original exception - audit failures should not prevent operation
            // execution
            throw throwable;
        }
    }

    /**
     * Performs the actual audit logging by extracting necessary information and
     * calling WriteAuditService.
     */
    private void auditOperation(ProceedingJoinPoint joinPoint, AuditWriteOperation annotation,
            AuditOperationType operationType, String resourceType, String description,
            AuditOperationStatus status, String errorMessage, Duration executionTime,
            Object result) {
        try {
            // Extract user information from security context
            User user = extractCurrentUser();
            if (user == null) {
                logger.warn("Could not extract current user for audit logging - skipping audit");
                return;
            }

            // Extract cluster connection from method parameters
            ClusterConnection cluster = extractClusterConnection(joinPoint);
            if (cluster == null) {
                logger.warn("Could not extract cluster connection for audit logging - skipping audit");
                return;
            }

            // Extract resource name from method parameters
            String resourceName = extractResourceName(joinPoint, resourceType);
            if (resourceName == null) {
                resourceName = "unknown";
            }

            // Build audit details
            Map<String, Object> auditDetails = buildAuditDetails(joinPoint, annotation, description,
                    executionTime, result);

            // Perform audit logging
            writeAuditService.auditWriteOperation(user, cluster, operationType, resourceType,
                    resourceName, auditDetails, status, errorMessage);

        } catch (Exception e) {
            // Log audit failures but don't throw - audit failures should not affect the
            // original operation
            logger.error("Failed to audit write operation: operationType={}, resourceType={}, status={}",
                    operationType, resourceType, status, e);
        }
    }

    /**
     * Extracts the current user from the Spring Security context.
     */
    private User extractCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof User) {
                return (User) authentication.getPrincipal();
            }

            // Handle case where principal is a UserPrincipal or similar wrapper
            if (authentication != null && authentication.getPrincipal() != null) {
                Object principal = authentication.getPrincipal();
                if (principal.getClass().getSimpleName().equals("UserPrincipal")) {
                    // Use reflection to get the User object from UserPrincipal
                    Method getUserMethod = principal.getClass().getMethod("getUser");
                    return (User) getUserMethod.invoke(principal);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not extract current user from security context", e);
        }
        return null;
    }

    /**
     * Extracts the ClusterConnection from method parameters.
     */
    private ClusterConnection extractClusterConnection(ProceedingJoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();

            // Look for ClusterConnection directly in parameters
            for (Object arg : args) {
                if (arg instanceof ClusterConnection) {
                    return (ClusterConnection) arg;
                }
            }

            // Look for UUID that might represent cluster ID
            UUID clusterId = null;
            for (Object arg : args) {
                if (arg instanceof UUID) {
                    clusterId = (UUID) arg;
                    break;
                }
            }

            // If we found a cluster ID, look it up in the repository
            if (clusterId != null) {
                logger.debug("Found cluster ID {}, attempting to resolve to ClusterConnection", clusterId);
                Optional<ClusterConnection> clusterConnection = clusterConnectionRepository.findById(clusterId);
                if (clusterConnection.isPresent()) {
                    logger.debug("Successfully resolved cluster ID {} to ClusterConnection", clusterId);
                    return clusterConnection.get();
                } else {
                    logger.debug("Cluster ID {} not found in repository", clusterId);
                }
            }

        } catch (Exception e) {
            logger.debug("Could not extract cluster connection from method arguments", e);
        }
        return null;
    }

    /**
     * Extracts the resource name from method parameters based on the resource type.
     */
    private String extractResourceName(ProceedingJoinPoint joinPoint, String resourceType) {
        try {
            String methodName = joinPoint.getSignature().getName();
            Object[] args = joinPoint.getArgs();

            // Handle binding operations specially
            if ("binding".equals(resourceType) && "createExchangeToQueueBinding".equals(methodName)) {
                // Method signature: createExchangeToQueueBinding(UUID clusterId, String vhost,
                // String source, String destination, ...)
                if (args.length >= 4) {
                    String source = args[2] instanceof String ? (String) args[2] : null;
                    String destination = args[3] instanceof String ? (String) args[3] : null;
                    if (source != null && destination != null) {
                        return source + " -> " + destination;
                    }
                }
            }

            // Handle queue operations specially - method signatures are consistent
            if ("queue".equals(resourceType)) {
                // Queue methods: methodName(UUID clusterId, String vhost, String queueName,
                // ...)
                if (args.length >= 3 && args[2] instanceof String) {
                    String queueName = (String) args[2];
                    // Queue name is the third parameter after URL decoding
                    if (!queueName.isEmpty() && !queueName.equals("Lw==")) {
                        return queueName;
                    }
                }
            }

            // Handle exchange operations specially
            if ("exchange".equals(resourceType)) {
                // Exchange methods: methodName(UUID clusterId, String vhost, String
                // exchangeName, ...) or
                // methodName(String exchangeName, ClusterConnection cluster, ...) or
                // methodName(UUID clusterId, CreateExchangeRequest request, ...)
                if (args.length >= 3 && args[2] instanceof String) {
                    String exchangeName = (String) args[2];
                    if (!exchangeName.isEmpty() && !exchangeName.equals("Lw==")) {
                        return exchangeName;
                    }
                } else if (args.length >= 1 && args[0] instanceof String) {
                    // Handle test method signature: createExchange(String exchangeName,
                    // ClusterConnection cluster)
                    String exchangeName = (String) args[0];
                    if (!exchangeName.isEmpty() && !exchangeName.equals("Lw==")) {
                        return exchangeName;
                    }
                }
            }

            // For other operations, look for objects with getName() method first
            for (Object arg : args) {
                if (arg != null) {
                    try {
                        Method getNameMethod = arg.getClass().getMethod("getName");
                        Object name = getNameMethod.invoke(arg);
                        if (name instanceof String && !((String) name).isEmpty()) {
                            return (String) name;
                        }
                    } catch (Exception e) {
                        // Ignore - this object doesn't have a getName method
                    }
                }
            }

            // Fallback: look for string parameters that might be resource names
            for (Object arg : args) {
                if (arg instanceof String) {
                    String stringArg = (String) arg;
                    // Skip UUIDs, encoded values, and other non-resource strings
                    if (stringArg.length() > 0 && !isUuidString(stringArg) &&
                            !stringArg.equals("Lw==") && stringArg.length() < 256) {
                        return stringArg;
                    }
                }
            }

        } catch (Exception e) {
            logger.debug("Could not extract resource name from method arguments", e);
        }
        return null;
    }

    /**
     * Check if a string looks like a UUID (contains 4 hyphens in UUID pattern)
     */
    private boolean isUuidString(String str) {
        return str.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    }

    /**
     * Builds a map of audit details including operation metadata, timing, and
     * optional parameters/return values.
     */
    private Map<String, Object> buildAuditDetails(ProceedingJoinPoint joinPoint, AuditWriteOperation annotation,
            String description, Duration executionTime, Object result) {
        Map<String, Object> details = new HashMap<>();

        // Add basic operation information
        details.put("method", joinPoint.getSignature().getName());
        details.put("class", joinPoint.getTarget().getClass().getSimpleName());
        details.put("executionTimeMs", executionTime.toMillis());

        if (!description.isEmpty()) {
            details.put("description", description);
        }

        // Add timestamp
        details.put("timestamp", Instant.now().toString());

        // Optionally include method parameters
        if (annotation.includeParameters()) {
            try {
                Object[] args = joinPoint.getArgs();
                if (args != null && args.length > 0) {
                    Map<String, Object> parameters = new HashMap<>();
                    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                    String[] parameterNames = signature.getParameterNames();

                    for (int i = 0; i < args.length && i < parameterNames.length; i++) {
                        if (args[i] != null) {
                            // Avoid including sensitive objects like User or ClusterConnection
                            if (!(args[i] instanceof User) && !(args[i] instanceof ClusterConnection)) {
                                parameters.put(parameterNames[i], sanitizeParameterValue(args[i]));
                            }
                        }
                    }

                    if (!parameters.isEmpty()) {
                        details.put("parameters", parameters);
                    }
                }
            } catch (Exception e) {
                logger.debug("Could not include method parameters in audit details", e);
            }
        }

        // Optionally include return value
        if (annotation.includeReturnValue() && result != null) {
            try {
                details.put("returnValue", sanitizeParameterValue(result));
            } catch (Exception e) {
                logger.debug("Could not include return value in audit details", e);
            }
        }

        return details;
    }

    /**
     * Sanitizes parameter values to avoid including sensitive information or overly
     * complex objects.
     */
    private Object sanitizeParameterValue(Object value) {
        if (value == null) {
            return null;
        }

        // For primitive types and strings, return as-is
        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        // For collections, return size information
        if (value instanceof java.util.Collection) {
            return "Collection[size=" + ((java.util.Collection<?>) value).size() + "]";
        }

        if (value instanceof java.util.Map) {
            return "Map[size=" + ((java.util.Map<?, ?>) value).size() + "]";
        }

        // For other objects, return class name and toString if it's safe
        String className = value.getClass().getSimpleName();
        try {
            String stringValue = value.toString();
            // Only include toString if it's not the default Object.toString format
            if (!stringValue.matches(".*@[0-9a-f]+$")) {
                return className + "[" + stringValue + "]";
            }
        } catch (Exception e) {
            // Ignore toString failures
        }

        return className + "[object]";
    }
}