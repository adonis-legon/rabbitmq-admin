package com.rabbitmq.admin.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for audit functionality.
 * Maps to app.audit.write-operations configuration section.
 * 
 * <p>
 * This class provides configuration for the write operations audit system,
 * including enabling/disabling audit logging, retention policies, and
 * processing options.
 * </p>
 * 
 * <p>
 * Configuration example:
 * </p>
 * 
 * <pre>
 * app:
 *   audit:
 *     write-operations:
 *       enabled: true
 *       retention-days: 90
 *       batch-size: 100
 *       async-processing: true
 * </pre>
 * 
 * <p>
 * Environment variable overrides:
 * </p>
 * <ul>
 * <li>AUDIT_WRITE_OPERATIONS_ENABLED - Enable/disable audit logging</li>
 * <li>AUDIT_RETENTION_DAYS - Number of days to retain audit records</li>
 * <li>AUDIT_BATCH_SIZE - Batch size for processing audit records</li>
 * <li>AUDIT_ASYNC_PROCESSING - Enable/disable asynchronous processing</li>
 * </ul>
 */
@ConfigurationProperties(prefix = "app.audit.write-operations")
public class AuditConfigurationProperties {

    /**
     * Whether write operations audit logging is enabled.
     * When disabled, no audit records will be created for write operations.
     * Default: false
     */
    @NotNull(message = "Audit enabled flag must not be null. Use true or false.")
    private Boolean enabled = false;

    /**
     * Number of days to retain audit records before cleanup.
     * Must be at least 1 day. Recommended values:
     * - Development: 7-30 days
     * - Production: 90-365 days
     * - Compliance environments: 365+ days
     * Default: 90 days
     */
    @Min(value = 1, message = "Retention days must be at least 1. Consider using 7 days for development or 90+ days for production.")
    @Max(value = 36500, message = "Retention days cannot exceed 36500 (100 years). Consider using a reasonable value like 365 days.")
    private Integer retentionDays = 90;

    /**
     * Batch size for processing audit records.
     * Larger batch sizes improve performance but use more memory.
     * Recommended values:
     * - Development: 10-50
     * - Production: 100-1000
     * Default: 100
     */
    @Min(value = 1, message = "Batch size must be at least 1. Consider using 10 for development or 100+ for production.")
    @Max(value = 10000, message = "Batch size cannot exceed 10000. Consider using a smaller value like 1000 for better memory management.")
    private Integer batchSize = 100;

    /**
     * Whether to process audit records asynchronously.
     * Asynchronous processing improves write operation performance but may delay
     * audit record creation.
     * Recommended:
     * - Development: false (for easier debugging)
     * - Production: true (for better performance)
     * Default: true
     */
    @NotNull(message = "Async processing flag must not be null. Use true for production or false for development.")
    private Boolean asyncProcessing = true;

    /**
     * Default constructor
     */
    public AuditConfigurationProperties() {
    }

    /**
     * Constructor with all fields
     */
    public AuditConfigurationProperties(Boolean enabled, Integer retentionDays,
            Integer batchSize, Boolean asyncProcessing) {
        this.enabled = enabled;
        this.retentionDays = retentionDays;
        this.batchSize = batchSize;
        this.asyncProcessing = asyncProcessing;
    }

    // Getters and setters
    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Integer getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(Integer retentionDays) {
        this.retentionDays = retentionDays;
    }

    public Integer getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(Integer batchSize) {
        this.batchSize = batchSize;
    }

    public Boolean getAsyncProcessing() {
        return asyncProcessing;
    }

    public void setAsyncProcessing(Boolean asyncProcessing) {
        this.asyncProcessing = asyncProcessing;
    }

    /**
     * Convenience method to check if audit is enabled.
     * Handles null values gracefully by returning false.
     * 
     * @return true if audit is enabled, false otherwise
     */
    public boolean isEnabled() {
        return enabled != null && enabled;
    }

    /**
     * Convenience method to check if async processing is enabled.
     * Handles null values gracefully by returning false.
     * 
     * @return true if async processing is enabled, false otherwise
     */
    public boolean isAsyncProcessing() {
        return asyncProcessing != null && asyncProcessing;
    }

    /**
     * Validates the configuration and returns any validation errors.
     * This method can be used for programmatic validation.
     * 
     * @return validation error message if configuration is invalid, null if valid
     */
    public String validateConfiguration() {
        if (enabled == null) {
            return "Audit enabled flag must not be null";
        }
        if (asyncProcessing == null) {
            return "Async processing flag must not be null";
        }
        if (retentionDays != null && retentionDays < 1) {
            return "Retention days must be at least 1";
        }
        if (retentionDays != null && retentionDays > 36500) {
            return "Retention days cannot exceed 36500 (100 years)";
        }
        if (batchSize != null && batchSize < 1) {
            return "Batch size must be at least 1";
        }
        if (batchSize != null && batchSize > 10000) {
            return "Batch size cannot exceed 10000";
        }
        return null; // Configuration is valid
    }

    /**
     * Checks if the configuration is valid.
     * 
     * @return true if configuration is valid, false otherwise
     */
    public boolean isValid() {
        return validateConfiguration() == null;
    }

    /**
     * Returns a summary of the current configuration for logging/debugging.
     * 
     * @return configuration summary string
     */
    public String getConfigurationSummary() {
        return String.format("Audit Configuration: enabled=%s, retention=%d days, batch=%d, async=%s",
                enabled, retentionDays, batchSize, asyncProcessing);
    }

    @Override
    public String toString() {
        return "AuditConfigurationProperties{" +
                "enabled=" + enabled +
                ", retentionDays=" + retentionDays +
                ", batchSize=" + batchSize +
                ", asyncProcessing=" + asyncProcessing +
                ", valid=" + isValid() +
                '}';
    }
}