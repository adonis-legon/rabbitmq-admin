package com.rabbitmq.admin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing an audit record for write operations performed on
 * RabbitMQ clusters.
 * This entity captures detailed information about each write operation
 * including the user,
 * target cluster, operation type, affected resources, and timestamps for
 * compliance and
 * security auditing purposes.
 */
@Entity
@Table(name = "audits", indexes = {
        @Index(name = "idx_audits_user_id", columnList = "user_id"),
        @Index(name = "idx_audits_cluster_id", columnList = "cluster_id"),
        @Index(name = "idx_audits_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audits_operation_type", columnList = "operation_type"),
        @Index(name = "idx_audits_resource_name", columnList = "resource_name"),
        @Index(name = "idx_audits_composite", columnList = "user_id, cluster_id, timestamp")
})
public class Audit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * The user who performed the write operation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required for audit record")
    private User user;

    /**
     * The cluster connection where the operation was performed
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id", nullable = false)
    @NotNull(message = "Cluster connection is required for audit record")
    private ClusterConnection cluster;

    /**
     * The type of write operation that was performed
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false)
    @NotNull(message = "Operation type is required")
    private AuditOperationType operationType;

    /**
     * The type of resource that was affected (exchange, queue, binding, message)
     */
    @Column(name = "resource_type", nullable = false, length = 100, columnDefinition = "VARCHAR(100)")
    @NotBlank(message = "Resource type is required")
    @Size(max = 100, message = "Resource type must not exceed 100 characters")
    private String resourceType;

    /**
     * The name of the specific resource that was affected
     */
    @Column(name = "resource_name", nullable = false, length = 500, columnDefinition = "VARCHAR(500)")
    @NotBlank(message = "Resource name is required")
    @Size(max = 500, message = "Resource name must not exceed 500 characters")
    private String resourceName;

    /**
     * Additional details about the operation stored as JSON string
     * Contains operation-specific information like exchange type, queue properties,
     * etc.
     */
    @Column(name = "resource_details", columnDefinition = "TEXT")
    @Size(max = 10000, message = "Resource details must not exceed 10000 characters")
    private String resourceDetails;

    /**
     * The status of the operation (SUCCESS, FAILURE, PARTIAL)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Operation status is required")
    private AuditOperationStatus status;

    /**
     * Error message if the operation failed or had partial success
     */
    @Column(name = "error_message", length = 1000, columnDefinition = "VARCHAR(1000)")
    @Size(max = 1000, message = "Error message must not exceed 1000 characters")
    private String errorMessage;

    /**
     * UTC timestamp when the operation was performed
     */
    @Column(nullable = false)
    @NotNull(message = "Timestamp is required")
    private Instant timestamp;

    /**
     * IP address of the client that initiated the operation
     */
    @Column(name = "client_ip", length = 45, columnDefinition = "VARCHAR(45)")
    @Size(max = 45, message = "Client IP must not exceed 45 characters")
    private String clientIp;

    /**
     * User agent string of the client that initiated the operation
     */
    @Column(name = "user_agent", length = 100, columnDefinition = "VARCHAR(100)")
    @Size(max = 100, message = "User agent must not exceed 100 characters")
    private String userAgent;

    /**
     * Timestamp when this audit record was created in the database
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    /**
     * Default constructor for JPA
     */
    public Audit() {
    }

    /**
     * Constructor for creating audit records with required fields
     */
    public Audit(User user, ClusterConnection cluster, AuditOperationType operationType,
            String resourceType, String resourceName, AuditOperationStatus status,
            Instant timestamp) {
        this.user = user;
        this.cluster = cluster;
        this.operationType = operationType;
        this.resourceType = resourceType;
        this.resourceName = resourceName;
        this.status = status;
        this.timestamp = timestamp;
    }

    /**
     * Constructor with all fields
     */
    public Audit(User user, ClusterConnection cluster, AuditOperationType operationType,
            String resourceType, String resourceName, String resourceDetails,
            AuditOperationStatus status, String errorMessage, Instant timestamp,
            String clientIp, String userAgent) {
        this(user, cluster, operationType, resourceType, resourceName, status, timestamp);
        this.resourceDetails = resourceDetails;
        this.errorMessage = errorMessage;
        this.clientIp = clientIp;
        this.userAgent = userAgent;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ClusterConnection getCluster() {
        return cluster;
    }

    public void setCluster(ClusterConnection cluster) {
        this.cluster = cluster;
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

    public String getResourceDetails() {
        return resourceDetails;
    }

    public void setResourceDetails(String resourceDetails) {
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
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Audit))
            return false;
        Audit that = (Audit) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Audit{" +
                "id=" + id +
                ", operationType=" + operationType +
                ", resourceType='" + resourceType + '\'' +
                ", resourceName='" + resourceName + '\'' +
                ", status=" + status +
                ", timestamp=" + timestamp +
                ", createdAt=" + createdAt +
                '}';
    }
}