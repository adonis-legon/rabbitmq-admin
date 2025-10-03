package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.rabbitmq.admin.model.AuditOperationStatus;
import com.rabbitmq.admin.model.AuditOperationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for audit record data transfer.
 * Contains all audit record information for API responses.
 */
public class AuditDto {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("username")
    @NotBlank(message = "Username is required")
    @Size(max = 100, message = "Username must not exceed 100 characters")
    private String username;

    @JsonProperty("clusterName")
    @NotBlank(message = "Cluster name is required")
    @Size(max = 200, message = "Cluster name must not exceed 200 characters")
    private String clusterName;

    @JsonProperty("operationType")
    @NotNull(message = "Operation type is required")
    private AuditOperationType operationType;

    @JsonProperty("resourceType")
    @NotBlank(message = "Resource type is required")
    @Size(max = 100, message = "Resource type must not exceed 100 characters")
    private String resourceType;

    @JsonProperty("resourceName")
    @NotBlank(message = "Resource name is required")
    @Size(max = 500, message = "Resource name must not exceed 500 characters")
    private String resourceName;

    @JsonProperty("resourceDetails")
    private Map<String, Object> resourceDetails;

    @JsonProperty("status")
    @NotNull(message = "Operation status is required")
    private AuditOperationStatus status;

    @JsonProperty("errorMessage")
    @Size(max = 1000, message = "Error message must not exceed 1000 characters")
    private String errorMessage;

    @JsonProperty("timestamp")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    @NotNull(message = "Timestamp is required")
    private Instant timestamp;

    @JsonProperty("clientIp")
    @Size(max = 45, message = "Client IP must not exceed 45 characters")
    private String clientIp;

    @JsonProperty("userAgent")
    @Size(max = 100, message = "User agent must not exceed 100 characters")
    private String userAgent;

    @JsonProperty("createdAt")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant createdAt;

    /**
     * Default constructor for JSON deserialization
     */
    public AuditDto() {
    }

    /**
     * Constructor with required fields
     */
    public AuditDto(UUID id, String username, String clusterName, AuditOperationType operationType,
                   String resourceType, String resourceName, AuditOperationStatus status, Instant timestamp) {
        this.id = id;
        this.username = username;
        this.clusterName = clusterName;
        this.operationType = operationType;
        this.resourceType = resourceType;
        this.resourceName = resourceName;
        this.status = status;
        this.timestamp = timestamp;
    }

    /**
     * Constructor with all fields
     */
    public AuditDto(UUID id, String username, String clusterName, AuditOperationType operationType,
                   String resourceType, String resourceName, Map<String, Object> resourceDetails,
                   AuditOperationStatus status, String errorMessage, Instant timestamp,
                   String clientIp, String userAgent, Instant createdAt) {
        this(id, username, clusterName, operationType, resourceType, resourceName, status, timestamp);
        this.resourceDetails = resourceDetails;
        this.errorMessage = errorMessage;
        this.clientIp = clientIp;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Map<String, Object> getResourceDetails() {
        return resourceDetails;
    }

    public void setResourceDetails(Map<String, Object> resourceDetails) {
        this.resourceDetails = resourceDetails;
    }

    public AuditOperationStatus getStatus() {
        return status;
    }

    public void setStatus(AuditOperationStatus status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "AuditDto{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", clusterName='" + clusterName + '\'' +
                ", operationType=" + operationType +
                ", resourceType='" + resourceType + '\'' +
                ", resourceName='" + resourceName + '\'' +
                ", status=" + status +
                ", timestamp=" + timestamp +
                '}';
    }
}