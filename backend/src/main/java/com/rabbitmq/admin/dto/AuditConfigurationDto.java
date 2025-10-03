package com.rabbitmq.admin.dto;

/**
 * DTO for audit configuration response.
 * Used to serialize audit configuration properties for API responses.
 */
public class AuditConfigurationDto {

    private Boolean enabled;
    private Integer retentionDays;
    private Integer batchSize;
    private Boolean asyncProcessing;

    /**
     * Default constructor
     */
    public AuditConfigurationDto() {
    }

    /**
     * Constructor with all fields
     */
    public AuditConfigurationDto(Boolean enabled, Integer retentionDays, Integer batchSize, Boolean asyncProcessing) {
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

    @Override
    public String toString() {
        return "AuditConfigurationDto{" +
                "enabled=" + enabled +
                ", retentionDays=" + retentionDays +
                ", batchSize=" + batchSize +
                ", asyncProcessing=" + asyncProcessing +
                '}';
    }
}