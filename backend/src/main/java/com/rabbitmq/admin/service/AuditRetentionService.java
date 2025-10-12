package com.rabbitmq.admin.service;

import com.rabbitmq.admin.config.AuditRetentionConfigurationProperties;
import com.rabbitmq.admin.model.Audit;
import com.rabbitmq.admin.repository.AuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service responsible for cleaning up old audit records based on retention
 * configuration.
 * Runs as a scheduled task when audit retention cleanup is enabled.
 * 
 * <p>
 * This service will automatically delete audit records older than the
 * configured
 * retention period according to the specified CRON schedule.
 * </p>
 * 
 * <p>
 * Configuration properties:
 * </p>
 * <ul>
 * <li>app.audit.retention.enabled - Enable/disable retention cleanup</li>
 * <li>app.audit.retention.days - Number of days to retain audit records</li>
 * <li>app.audit.retention.clean-schedule - CRON expression for cleanup
 * schedule</li>
 * </ul>
 * 
 * <p>
 * The service is only active when retention cleanup is enabled via
 * configuration.
 * </p>
 */
@Service
@ConditionalOnProperty(prefix = "app.audit.retention", name = "enabled", havingValue = "true", matchIfMissing = true)
public class AuditRetentionService {

    private static final Logger logger = LoggerFactory.getLogger(AuditRetentionService.class);

    private final AuditRepository auditRepository;
    private final AuditRetentionConfigurationProperties retentionConfig;

    public AuditRetentionService(AuditRepository auditRepository,
            AuditRetentionConfigurationProperties retentionConfig) {
        this.auditRepository = auditRepository;
        this.retentionConfig = retentionConfig;

        logger.info("Audit Retention Service initialized with configuration: {}",
                retentionConfig.getConfigurationSummary());
    }

    /**
     * Scheduled method that cleans up old audit records based on retention
     * configuration.
     * Runs according to the CRON expression defined in retention configuration.
     * 
     * <p>
     * The method will:
     * </p>
     * <ol>
     * <li>Calculate the cutoff timestamp based on current time and retention
     * days</li>
     * <li>Find all audit records older than the cutoff timestamp</li>
     * <li>Delete the old records in batches for performance</li>
     * <li>Log the cleanup results</li>
     * </ol>
     * 
     * <p>
     * The schedule is configured via the CRON expression in
     * app.audit.retention.clean-schedule.
     * Default schedule is "0 0 0 * * ?" (daily at midnight).
     * </p>
     */
    @Scheduled(cron = "${app.audit.retention.clean-schedule:0 0 0 * * ?}")
    @Transactional
    public void cleanupOldAuditRecords() {
        if (!retentionConfig.isEnabled()) {
            logger.debug("Audit retention cleanup is disabled, skipping cleanup task");
            return;
        }

        try {
            logger.info("Starting audit retention cleanup task - retention days: {}, schedule: '{}'",
                    retentionConfig.getDays(), retentionConfig.getCleanSchedule());

            // Calculate cutoff timestamp
            Instant cutoffTimestamp = Instant.now().minus(retentionConfig.getDays(), ChronoUnit.DAYS);
            LocalDateTime cutoffDateTime = LocalDateTime.ofInstant(cutoffTimestamp, ZoneId.systemDefault());

            logger.debug("Cutoff timestamp for audit cleanup: {} ({})", cutoffTimestamp, cutoffDateTime);

            // Find old audit records
            List<Audit> oldAuditRecords = auditRepository.findByTimestampBefore(cutoffTimestamp);

            if (oldAuditRecords.isEmpty()) {
                logger.info("No audit records found older than {} days, cleanup completed", retentionConfig.getDays());
                return;
            }

            int totalRecordsToDelete = oldAuditRecords.size();
            logger.info("Found {} audit records older than {} days to delete", totalRecordsToDelete,
                    retentionConfig.getDays());

            // Delete records in batches for better performance and memory management
            int batchSize = 1000; // Process in batches of 1000 records
            int deletedCount = 0;
            int batchCount = 0;

            for (int i = 0; i < oldAuditRecords.size(); i += batchSize) {
                int endIndex = Math.min(i + batchSize, oldAuditRecords.size());
                List<Audit> batch = oldAuditRecords.subList(i, endIndex);

                batchCount++;
                logger.debug("Processing batch {} of audit records ({} records)", batchCount, batch.size());

                // Delete batch
                auditRepository.deleteAll(batch);
                deletedCount += batch.size();

                logger.debug("Deleted batch {} - {} records processed so far", batchCount, deletedCount);
            }

            // Log final results
            logger.info("Audit retention cleanup completed successfully - deleted {} audit records older than {} days",
                    deletedCount, retentionConfig.getDays());

            // Log some statistics
            long remainingRecords = auditRepository.count();
            logger.info("Total audit records remaining in database: {}", remainingRecords);

        } catch (Exception e) {
            logger.error("Error occurred during audit retention cleanup", e);
            // Don't rethrow to prevent breaking the scheduled task mechanism
        }
    }

    /**
     * Manually trigger audit cleanup for testing or administrative purposes.
     * This method can be called directly to perform cleanup outside of the
     * scheduled time.
     * 
     * @return number of audit records deleted
     */
    public int performManualCleanup() {
        logger.info("Manual audit retention cleanup requested");

        if (!retentionConfig.isEnabled()) {
            logger.warn("Audit retention cleanup is disabled, manual cleanup aborted");
            return 0;
        }

        try {
            Instant cutoffTimestamp = Instant.now().minus(retentionConfig.getDays(), ChronoUnit.DAYS);
            List<Audit> oldAuditRecords = auditRepository.findByTimestampBefore(cutoffTimestamp);

            if (oldAuditRecords.isEmpty()) {
                logger.info("No audit records found for manual cleanup");
                return 0;
            }

            int recordCount = oldAuditRecords.size();
            auditRepository.deleteAll(oldAuditRecords);

            logger.info("Manual audit cleanup completed - deleted {} records", recordCount);
            return recordCount;

        } catch (Exception e) {
            logger.error("Error occurred during manual audit retention cleanup", e);
            throw new RuntimeException("Manual audit cleanup failed", e);
        }
    }

    /**
     * Get the current retention configuration summary for monitoring/debugging.
     * 
     * @return configuration summary string
     */
    public String getRetentionConfigurationSummary() {
        return retentionConfig.getConfigurationSummary();
    }

    /**
     * Check if retention cleanup is currently enabled.
     * 
     * @return true if retention cleanup is enabled, false otherwise
     */
    public boolean isRetentionEnabled() {
        return retentionConfig.isEnabled();
    }

    /**
     * Get the current retention period in days.
     * 
     * @return retention period in days
     */
    public int getRetentionDays() {
        return retentionConfig.getDays();
    }

    /**
     * Get the current cleanup schedule CRON expression.
     * 
     * @return CRON expression for cleanup schedule
     */
    public String getCleanupSchedule() {
        return retentionConfig.getCleanSchedule();
    }
}