package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.AuditConfigurationDto;
import com.rabbitmq.admin.dto.AuditDto;
import com.rabbitmq.admin.dto.AuditFilterRequest;
import com.rabbitmq.admin.dto.PagedResponse;
import com.rabbitmq.admin.exception.AuditServiceException;
import com.rabbitmq.admin.service.WriteAuditService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for audit record management operations.
 * Requires ADMINISTRATOR role for access.
 * Only available when WriteAuditService is enabled via configuration.
 */
@RestController
@RequestMapping("/api/audits")
@Validated
public class AuditController {

    private static final Logger logger = LoggerFactory.getLogger(AuditController.class);

    private final WriteAuditService writeAuditService;

    public AuditController(WriteAuditService writeAuditService) {
        this.writeAuditService = writeAuditService;
    }

    /**
     * Get audit records with optional filtering, pagination, and sorting.
     * 
     * @param filterRequest the filter criteria (optional)
     * @param page          the page number (0-based, default: 0)
     * @param pageSize      the number of items per page (default: 50, max: 200)
     * @param sortBy        the field to sort by (default: timestamp)
     * @param sortDirection the sort direction (asc/desc, default: desc)
     * @return paginated response containing audit records
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<PagedResponse<AuditDto>> getAudits(
            @Valid @ModelAttribute AuditFilterRequest filterRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        try {
            logger.info("AuditController.getAudits called");

            // Validate pagination parameters
            if (page < 0) {
                throw new IllegalArgumentException("Page number must be non-negative");
            }
            if (pageSize <= 0 || pageSize > 200) {
                throw new IllegalArgumentException("Page size must be between 1 and 200");
            }

            // Validate sort direction
            Sort.Direction direction;
            try {
                direction = Sort.Direction.fromString(sortDirection);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Sort direction must be 'asc' or 'desc'");
            }

            // Validate sort field
            String validatedSortBy = validateSortField(sortBy);

            // Create pageable with sorting
            Pageable pageable = PageRequest.of(page, pageSize, Sort.by(direction, validatedSortBy));

            logger.debug(
                    "Retrieving audit records with filters: {}, page: {}, pageSize: {}, sortBy: {}, sortDirection: {}",
                    filterRequest, page, pageSize, validatedSortBy, sortDirection);

            // Get audit records from service
            Page<AuditDto> auditPage = writeAuditService.getAuditRecords(filterRequest, pageable);

            // Convert to PagedResponse
            PagedResponse<AuditDto> response = new PagedResponse<>(
                    auditPage.getContent(),
                    auditPage.getNumber() + 1, // Convert to 1-based page numbering for frontend
                    auditPage.getSize(),
                    (int) auditPage.getTotalElements());

            logger.debug("Successfully retrieved {} audit records (page {} of {})",
                    auditPage.getNumberOfElements(), auditPage.getNumber() + 1, auditPage.getTotalPages());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request parameters for audit records: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Failed to retrieve audit records", e);
            throw new AuditServiceException("Failed to retrieve audit records: " + e.getMessage(), e);
        }
    }

    /**
     * Get audit configuration details including enabled status and thresholds.
     * 
     * @return audit configuration details
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AuditConfigurationDto> getAuditConfiguration() {
        try {
            logger.debug("Retrieving audit configuration");
            AuditConfigurationDto config = writeAuditService.getAuditConfigurationDto();
            return ResponseEntity.ok(config);

        } catch (Exception e) {
            logger.error("Failed to retrieve audit configuration", e);
            throw new RuntimeException("Failed to retrieve audit configuration: " + e.getMessage(), e);
        }
    }

    /**
     * Explicitly handle PUT requests to individual audit records - not allowed for
     * security.
     * Audit records are immutable.
     * 
     * @param auditId the audit record ID
     * @return 404 Not Found
     */
    @PutMapping("/{auditId}")
    public ResponseEntity<Void> updateAuditRecord(@PathVariable UUID auditId) {
        // Audit records are immutable - no PUT operations allowed
        return ResponseEntity.notFound().build();
    }

    /**
     * Explicitly handle DELETE requests to individual audit records - not allowed
     * for security.
     * Audit records are immutable.
     * 
     * @param auditId the audit record ID
     * @return 404 Not Found
     */
    @DeleteMapping("/{auditId}")
    public ResponseEntity<Void> deleteAuditRecord(@PathVariable UUID auditId) {
        // Audit records are immutable - no DELETE operations allowed
        return ResponseEntity.notFound().build();
    }

    /**
     * Validates the sort field to prevent SQL injection and ensure valid fields.
     * 
     * @param sortBy the requested sort field
     * @return validated sort field
     * @throws IllegalArgumentException if the sort field is invalid
     */
    private String validateSortField(String sortBy) {
        // Define allowed sort fields based on AuditDto properties
        switch (sortBy.toLowerCase()) {
            case "timestamp":
                return "timestamp";
            case "username":
                return "user.username";
            case "clustername":
            case "cluster_name":
                return "cluster.name";
            case "operationtype":
            case "operation_type":
                return "operationType";
            case "resourcetype":
            case "resource_type":
                return "resourceType";
            case "resourcename":
            case "resource_name":
                return "resourceName";
            case "status":
                return "status";
            case "createdat":
            case "created_at":
                return "createdAt";
            case "clientip":
            case "client_ip":
                return "clientIp";
            default:
                throw new IllegalArgumentException("Invalid sort field: " + sortBy +
                        ". Allowed fields: timestamp, username, clusterName, operationType, resourceType, resourceName, status, createdAt, clientIp");
        }
    }
}