package com.rabbitmq.admin.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for audit retention functionality.
 * Maps to app.audit.retention configuration section.
 * 
 * <p>
 * This class provides configuration for the audit retention cleanup system,
 * including enabling/disabling retention cleanup, retention period, and
 * cleanup schedule.
 * </p>
 * 
 * <p>
 * Configuration example:
 * </p>
 * 
 * <pre>
 * app:
 *   audit:
 *     retention:
 *       enabled: true
 *       days: 90
 *       clean-schedule: "0 0 0 * * ?"
 * </pre>
 * 
 * <p>
 * Environment variable overrides:
 * </p>
 * <ul>
 * <li>AUDIT_RETENTION_ENABLED - Enable/disable audit retention cleanup</li>
 * <li>AUDIT_RETENTION_DAYS - Number of days to retain audit records</li>
 * <li>AUDIT_RETENTION_CLEAN_SCHEDULE - CRON expression for cleanup
 * schedule</li>
 * </ul>
 */
@ConfigurationProperties(prefix = "app.audit.retention")
public class AuditRetentionConfigurationProperties {

    /**
     * Whether audit retention cleanup is enabled.
     * When disabled, no automatic cleanup of old audit records will occur.
     * Default: true
     */
    @NotNull(message = "Audit retention enabled flag must not be null. Use true or false.")
    private Boolean enabled = true;

    /**
     * Number of days to retain audit records before cleanup.
     * Records older than this will be deleted by the cleanup process.
     * Must be at least 1 day. Recommended values:
     * - Development: 7-30 days
     * - Production: 90-365 days
     * - Compliance environments: 365+ days
     * Default: 90 days
     */
    @NotNull(message = "Retention days must not be null.")
    @Min(value = 1, message = "Retention days must be at least 1. Consider using 7 days for development or 90+ days for production.")
    @jakarta.validation.constraints.Max(value = 36500, message = "Retention days cannot exceed 36500 (100 years). Consider using a reasonable value like 365 days.")
    private Integer days = 90;

    /**
     * CRON expression for the cleanup schedule.
     * Determines when the audit retention cleanup task will run.
     * Default: "0 0 0 * * ?" (daily at midnight)
     * 
     * Common CRON expressions:
     * - "0 0 0 * * ?" - Daily at midnight
     * - "0 0 2 * * ?" - Daily at 2 AM
     * - "0 0 0 * * SUN" - Weekly on Sunday at midnight
     * - "0 0 0 1 * ?" - Monthly on the 1st at midnight
     */
    @NotNull(message = "Clean schedule must not be null.")
    @Pattern(regexp = "^[0-9*,/-]+\\s+[0-9*,/-]+\\s+[0-9*,/-]+\\s+[0-9*,/?LW-]+\\s+[0-9*,/?L#-]+\\s+[0-9*,/?L#-]+(?:\\s+[0-9*,/?L#-]+)?$", message = "Clean schedule must be a valid CRON expression. Example: '0 0 0 * * ?' for daily at midnight.")
    private String cleanSchedule = "0 0 0 * * ?";

    /**
     * Default constructor
     */
    public AuditRetentionConfigurationProperties() {
    }

    /**
     * Constructor with all fields
     */
    public AuditRetentionConfigurationProperties(Boolean enabled, Integer days, String cleanSchedule) {
        this.enabled = enabled;
        this.days = days;
        this.cleanSchedule = cleanSchedule;
    }

    // Getters and setters
    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }

    public String getCleanSchedule() {
        return cleanSchedule;
    }

    public void setCleanSchedule(String cleanSchedule) {
        this.cleanSchedule = cleanSchedule;
    }

    /**
     * Convenience method to check if retention cleanup is enabled.
     * Handles null values gracefully by returning false.
     * 
     * @return true if retention cleanup is enabled, false otherwise
     */
    public boolean isEnabled() {
        return enabled != null && enabled;
    }

    /**
     * Validates the configuration and returns any validation errors.
     * This method can be used for programmatic validation.
     * 
     * @return validation error message if configuration is invalid, null if valid
     */
    public String validateConfiguration() {
        if (enabled == null) {
            return "Audit retention enabled flag must not be null";
        }
        if (days == null) {
            return "Retention days must not be null";
        }
        if (days < 1) {
            return "Retention days must be at least 1";
        }
        if (days > 36500) {
            return "Retention days cannot exceed 36500 (100 years)";
        }
        if (cleanSchedule == null || cleanSchedule.trim().isEmpty()) {
            return "Clean schedule must not be null or empty";
        }
        return null;
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
        return String.format("Audit Retention Configuration: enabled=%s, days=%d, schedule='%s'",
                enabled, days, cleanSchedule);
    }

    @Override
    public String toString() {
        return "AuditRetentionConfigurationProperties{" +
                "enabled=" + enabled +
                ", days=" + days +
                ", cleanSchedule='" + cleanSchedule + '\'' +
                ", valid=" + isValid() +
                '}';
    }
}