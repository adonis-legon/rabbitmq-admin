package com.rabbitmq.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.admin.config.AuditConfigurationProperties;
import com.rabbitmq.admin.dto.AuditConfigurationDto;
import com.rabbitmq.admin.dto.AuditFilterRequest;
import com.rabbitmq.admin.dto.AuditDto;
import com.rabbitmq.admin.model.*;
import com.rabbitmq.admin.repository.AuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for auditing write operations to RabbitMQ clusters.
 * Provides database-backed audit logging with configurable behavior.
 * Integrates with existing ResourceAuditService for dual logging (file +
 * database).
 */
@Service
@ConditionalOnProperty(name = "app.audit.write-operations.enabled", havingValue = "true", matchIfMissing = false)
public class WriteAuditService {

    private static final Logger logger = LoggerFactory.getLogger(WriteAuditService.class);

    private final AuditRepository auditRepository;
    private final ResourceAuditService resourceAuditService;
    private final AuditConfigurationProperties auditConfig;
    private final ObjectMapper objectMapper;

    public WriteAuditService(AuditRepository auditRepository,
            ResourceAuditService resourceAuditService,
            AuditConfigurationProperties auditConfig,
            ObjectMapper objectMapper) {
        this.auditRepository = auditRepository;
        this.resourceAuditService = resourceAuditService;
        this.auditConfig = auditConfig;
        this.objectMapper = objectMapper;

        logger.info("WriteAuditService initialized with configuration: {}", auditConfig);
    }

    /**
     * Audits a write operation by creating and persisting an audit record.
     * Also logs to file via ResourceAuditService for dual logging.
     * 
     * @param user          the user who performed the operation
     * @param cluster       the cluster where the operation was performed
     * @param operationType the type of write operation
     * @param resourceType  the type of resource affected (exchange, queue, binding,
     *                      message)
     * @param resourceName  the name of the specific resource
     * @param details       additional operation-specific details
     * @param status        the status of the operation (SUCCESS, FAILURE, PARTIAL)
     * @param errorMessage  error message if the operation failed
     */
    public void auditWriteOperation(User user, ClusterConnection cluster,
            AuditOperationType operationType, String resourceType,
            String resourceName, Map<String, Object> details,
            AuditOperationStatus status, String errorMessage) {
        try {
            if (auditConfig.isAsyncProcessing()) {
                auditWriteOperationAsync(user, cluster, operationType, resourceType,
                        resourceName, details, status, errorMessage);
            } else {
                auditWriteOperationSync(user, cluster, operationType, resourceType,
                        resourceName, details, status, errorMessage);
            }
        } catch (Exception e) {
            logger.error("Failed to audit write operation: user={}, cluster={}, operation={}, resource={}",
                    user.getUsername(), cluster.getName(), operationType, resourceName, e);
            // Don't rethrow - audit failures should not prevent the original operation
        }
    }

    /**
     * Synchronous version of audit operation
     */
    @Transactional
    public void auditWriteOperationSync(User user, ClusterConnection cluster,
            AuditOperationType operationType, String resourceType,
            String resourceName, Map<String, Object> details,
            AuditOperationStatus status, String errorMessage) {
        try {
            // Create audit record
            Audit auditRecord = createAuditRecord(user, cluster, operationType, resourceType,
                    resourceName, details, status, errorMessage);

            // Save to database
            auditRepository.save(auditRecord);

            // Also log to file via ResourceAuditService for dual logging
            logToResourceAuditService(user, cluster, operationType, resourceType,
                    resourceName, details, status, errorMessage);

            logger.debug(
                    "Successfully audited write operation: user={}, cluster={}, operation={}, resource={}, status={}",
                    user.getUsername(), cluster.getName(), operationType, resourceName, status);

        } catch (Exception e) {
            logger.error(
                    "Failed to audit write operation synchronously: user={}, cluster={}, operation={}, resource={}",
                    user.getUsername(), cluster.getName(), operationType, resourceName, e);
        }
    }

    /**
     * Asynchronous version of audit operation
     */
    @Async
    public CompletableFuture<Void> auditWriteOperationAsync(User user, ClusterConnection cluster,
            AuditOperationType operationType, String resourceType,
            String resourceName, Map<String, Object> details,
            AuditOperationStatus status, String errorMessage) {
        return CompletableFuture.runAsync(() -> {
            auditWriteOperationSync(user, cluster, operationType, resourceType,
                    resourceName, details, status, errorMessage);
        });
    }

    /**
     * Retrieves audit records with filtering and pagination support.
     * 
     * @param filterRequest the filter criteria
     * @param pageable      pagination information
     * @return page of audit record DTOs
     */
    @Transactional(readOnly = true)
    public Page<AuditDto> getAuditRecords(AuditFilterRequest filterRequest, Pageable pageable) {
        try {
            // Use specific repository methods to avoid PostgreSQL parameter type issues
            Page<Audit> auditPage = getAuditPageWithFilters(filterRequest, pageable);

            // Convert to DTOs
            return auditPage.map(this::convertToDto);

        } catch (Exception e) {
            logger.error("Failed to retrieve audit records with filters: {}", filterRequest, e);
            throw new RuntimeException("Failed to retrieve audit records", e);
        }
    }

    /**
     * Gets audit page with filters using specific repository methods to avoid
     * PostgreSQL parameter type issues.
     */
    private Page<Audit> getAuditPageWithFilters(AuditFilterRequest filterRequest, Pageable pageable) {
        // Handle null filter request
        if (filterRequest == null) {
            return auditRepository.findAll(pageable);
        }

        String username = filterRequest.getUsername();
        String clusterName = filterRequest.getClusterName();
        String resourceName = filterRequest.getResourceName();
        String resourceType = filterRequest.getResourceType();
        AuditOperationType operationType = filterRequest.getOperationType();
        AuditOperationStatus status = filterRequest.getStatus();
        Instant startTime = filterRequest.getStartTime();
        Instant endTime = filterRequest.getEndTime();

        // Apply filters in priority order - start with most specific filters first

        // Username filter (most common filter)
        if (username != null && !username.trim().isEmpty()) {
            return auditRepository.findByUserUsernameContainingIgnoreCase(username.trim(), pageable);
        }

        // Cluster name filter
        if (clusterName != null && !clusterName.trim().isEmpty()) {
            return auditRepository.findByClusterNameContainingIgnoreCase(clusterName.trim(), pageable);
        }

        // Resource name filter
        if (resourceName != null && !resourceName.trim().isEmpty()) {
            return auditRepository.findByResourceNameContainingIgnoreCase(resourceName.trim(), pageable);
        }

        // Resource type filter - handle comma-separated values
        if (resourceType != null && !resourceType.trim().isEmpty()) {
            // Split by comma and clean up the values
            java.util.List<String> resourceTypes = java.util.Arrays.asList(resourceType.split(","))
                    .stream()
                    .map(String::trim)
                    .filter(type -> !type.isEmpty())
                    .collect(java.util.stream.Collectors.toList());

            if (resourceTypes.size() == 1) {
                return auditRepository.findByResourceTypeIgnoreCase(resourceTypes.get(0), pageable);
            } else if (resourceTypes.size() > 1) {
                return auditRepository.findByResourceTypeInIgnoreCase(resourceTypes, pageable);
            }
        }

        // Use specific repository methods based on what filters are provided
        if (operationType != null && status != null) {
            return auditRepository.findByOperationTypeAndStatus(operationType, status, pageable);
        } else if (operationType != null) {
            return auditRepository.findByOperationType(operationType, pageable);
        } else if (status != null) {
            return auditRepository.findByStatus(status, pageable);
        } else if (startTime != null && endTime != null) {
            return auditRepository.findByTimestampBetween(startTime, endTime, pageable);
        } else {
            // No filters provided, return all records
            return auditRepository.findAll(pageable);
        }
    }

    /**
     * Creates an audit record entity from the provided parameters
     */
    private Audit createAuditRecord(User user, ClusterConnection cluster,
            AuditOperationType operationType, String resourceType,
            String resourceName, Map<String, Object> details,
            AuditOperationStatus status, String errorMessage) {
        Instant timestamp = Instant.now();

        // Convert details to JSON string
        String resourceDetails = null;
        if (details != null && !details.isEmpty()) {
            try {
                resourceDetails = objectMapper.writeValueAsString(details);
            } catch (JsonProcessingException e) {
                logger.warn("Failed to serialize resource details to JSON: {}", details, e);
                resourceDetails = details.toString();
            }
        }

        // Get client information from MDC if available
        String clientIp = MDC.get("clientIp");
        String userAgent = MDC.get("userAgent");

        return new Audit(user, cluster, operationType, resourceType, resourceName,
                resourceDetails, status, errorMessage, timestamp, clientIp, userAgent);
    }

    /**
     * Logs the audit information to ResourceAuditService for dual logging
     */
    private void logToResourceAuditService(User user, ClusterConnection cluster,
            AuditOperationType operationType, String resourceType,
            String resourceName, Map<String, Object> details,
            AuditOperationStatus status, String errorMessage) {
        try {
            // Prepare parameters for ResourceAuditService
            Map<String, Object> auditParameters = new HashMap<>();
            auditParameters.put("operationType", operationType.name());
            auditParameters.put("resourceType", resourceType);
            auditParameters.put("resourceName", resourceName);
            auditParameters.put("status", status.name());

            if (details != null) {
                auditParameters.put("details", details);
            }

            if (errorMessage != null) {
                auditParameters.put("errorMessage", errorMessage);
            }

            // Log based on operation status
            if (status == AuditOperationStatus.SUCCESS) {
                resourceAuditService.logResourceAccess(
                        user.getUsername(),
                        cluster.getId(),
                        resourceType,
                        "WRITE_" + operationType.name(),
                        auditParameters);
            } else {
                resourceAuditService.logResourceAccessFailure(
                        user.getUsername(),
                        cluster.getId(),
                        resourceType,
                        "WRITE_" + operationType.name(),
                        errorMessage != null ? errorMessage : "Operation failed",
                        "WRITE_OPERATION_FAILURE");
            }

        } catch (Exception e) {
            logger.warn("Failed to log audit information to ResourceAuditService: user={}, cluster={}, operation={}",
                    user.getUsername(), cluster.getName(), operationType, e);
        }
    }

    /**
     * Converts an Audit entity to AuditDto
     */
    private AuditDto convertToDto(Audit audit) {
        Map<String, Object> resourceDetails = null;

        // Parse JSON resource details if present
        if (audit.getResourceDetails() != null && !audit.getResourceDetails().trim().isEmpty()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> parsedDetails = objectMapper.readValue(audit.getResourceDetails(), Map.class);
                resourceDetails = parsedDetails;
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse resource details JSON for audit record {}: {}",
                        audit.getId(), audit.getResourceDetails(), e);
                // Fallback to simple map with raw string
                resourceDetails = Map.of("raw", audit.getResourceDetails());
            }
        }

        return new AuditDto(
                audit.getId(),
                audit.getUser().getUsername(),
                audit.getCluster().getName(),
                audit.getOperationType(),
                audit.getResourceType(),
                audit.getResourceName(),
                resourceDetails,
                audit.getStatus(),
                audit.getErrorMessage(),
                audit.getTimestamp(),
                audit.getClientIp(),
                audit.getUserAgent(),
                audit.getCreatedAt());
    }

    /**
     * Gets the current audit configuration
     */
    public AuditConfigurationProperties getAuditConfiguration() {
        return auditConfig;
    }

    /**
     * Gets the current audit configuration as a DTO for API responses
     */
    public AuditConfigurationDto getAuditConfigurationDto() {
        return new AuditConfigurationDto(
                auditConfig.getEnabled(),
                auditConfig.getRetentionDays(),
                auditConfig.getBatchSize(),
                auditConfig.getAsyncProcessing());
    }

    /**
     * Checks if audit logging is enabled
     */
    public boolean isAuditEnabled() {
        return auditConfig.isEnabled();
    }
}