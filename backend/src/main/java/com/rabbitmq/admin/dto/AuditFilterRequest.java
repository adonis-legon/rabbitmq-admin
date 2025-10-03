package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.rabbitmq.admin.model.AuditOperationStatus;
import com.rabbitmq.admin.model.AuditOperationType;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * DTO for audit record filtering requests.
 * Contains optional filter parameters for querying audit records.
 */
public class AuditFilterRequest {

    @JsonProperty("username")
    @Size(max = 100, message = "Username filter must not exceed 100 characters")
    private String username;

    @JsonProperty("clusterName")
    @Size(max = 200, message = "Cluster name filter must not exceed 200 characters")
    private String clusterName;

    @JsonProperty("operationType")
    private AuditOperationType operationType;

    @JsonProperty("status")
    private AuditOperationStatus status;

    @JsonProperty("resourceName")
    @Size(max = 500, message = "Resource name filter must not exceed 500 characters")
    private String resourceName;

    @JsonProperty("resourceType")
    @Size(max = 100, message = "Resource type filter must not exceed 100 characters")
    private String resourceType;

    @JsonProperty("startTime")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant startTime;

    @JsonProperty("endTime")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant endTime;

    /**
     * Default constructor for JSON deserialization
     */
    public AuditFilterRequest() {
    }

    /**
     * Constructor with all fields
     */
    public AuditFilterRequest(String username, String clusterName, AuditOperationType operationType,
            AuditOperationStatus status, String resourceName, String resourceType,
            Instant startTime, Instant endTime) {
        this.username = username;
        this.clusterName = clusterName;
        this.operationType = operationType;
        this.status = status;
        this.resourceName = resourceName;
        this.resourceType = resourceType;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    /**
     * Checks if any filter is applied
     */
    public boolean hasFilters() {
        return username != null || clusterName != null || operationType != null ||
                status != null || resourceName != null || resourceType != null ||
                startTime != null || endTime != null;
    }

    /**
     * Checks if date range filter is applied
     */
    public boolean hasDateRangeFilter() {
        return startTime != null || endTime != null;
    }

    // Getters and setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getClusterName() {
        return clusterName;
    }

    public void setClusterName(String clusterName) {
        this.clusterName = clusterName;
    }

    public AuditOperationType getOperationType() {
        return operationType;
    }

    public void setOperationType(AuditOperationType operationType) {
        this.operationType = operationType;
    }

    public AuditOperationStatus getStatus() {
        return status;
    }

    public void setStatus(AuditOperationStatus status) {
        this.status = status;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    @Override
    public String toString() {
        return "AuditFilterRequest{" +
                "username='" + username + '\'' +
                ", clusterName='" + clusterName + '\'' +
                ", operationType=" + operationType +
                ", status=" + status +
                ", resourceName='" + resourceName + '\'' +
                ", resourceType='" + resourceType + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                '}';
    }
}