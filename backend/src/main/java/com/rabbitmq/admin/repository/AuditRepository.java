package com.rabbitmq.admin.repository;

import com.rabbitmq.admin.model.Audit;
import com.rabbitmq.admin.model.AuditOperationType;
import com.rabbitmq.admin.model.AuditOperationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Audit entity operations.
 * Provides CRUD operations and custom query methods for audit record
 * management.
 * Supports filtering by user, cluster, operation type, date range, and resource
 * name.
 */
@Repository
public interface AuditRepository extends JpaRepository<Audit, UUID> {

    /**
     * Find audit records by user username (case-insensitive).
     * 
     * @param username the username to search for
     * @param pageable pagination information
     * @return page of audit records for the specified user
     */
    Page<Audit> findByUserUsernameContainingIgnoreCase(String username, Pageable pageable);

    /**
     * Find audit records by cluster name (case-insensitive).
     * 
     * @param clusterName the cluster name to search for
     * @param pageable    pagination information
     * @return page of audit records for the specified cluster
     */
    Page<Audit> findByClusterNameContainingIgnoreCase(String clusterName, Pageable pageable);

    /**
     * Find audit records by operation type.
     * 
     * @param operationType the operation type to filter by
     * @param pageable      pagination information
     * @return page of audit records for the specified operation type
     */
    Page<Audit> findByOperationType(AuditOperationType operationType, Pageable pageable);

    /**
     * Find audit records by operation status.
     * 
     * @param status   the operation status to filter by
     * @param pageable pagination information
     * @return page of audit records for the specified status
     */
    Page<Audit> findByStatus(AuditOperationStatus status, Pageable pageable);

    /**
     * Find audit records within a timestamp range.
     * 
     * @param startTime the start of the time range (inclusive)
     * @param endTime   the end of the time range (inclusive)
     * @param pageable  pagination information
     * @return page of audit records within the specified time range
     */
    Page<Audit> findByTimestampBetween(Instant startTime, Instant endTime, Pageable pageable);

    /**
     * Find audit records by resource name (case-insensitive partial match).
     * 
     * @param resourceName the resource name to search for
     * @param pageable     pagination information
     * @return page of audit records for resources matching the name
     */
    Page<Audit> findByResourceNameContainingIgnoreCase(String resourceName, Pageable pageable);

    /**
     * Find audit records by resource type (case-insensitive).
     * 
     * @param resourceType the resource type to filter by
     * @param pageable     pagination information
     * @return page of audit records for the specified resource type
     */
    Page<Audit> findByResourceTypeIgnoreCase(String resourceType, Pageable pageable);

    /**
     * Find audit records by multiple resource types (case-insensitive).
     * 
     * @param resourceTypes the list of resource types to filter by
     * @param pageable      pagination information
     * @return page of audit records for the specified resource types
     */
    Page<Audit> findByResourceTypeInIgnoreCase(java.util.List<String> resourceTypes, Pageable pageable);

    /**
     * Find audit records by user ID.
     * 
     * @param userId   the user ID to filter by
     * @param pageable pagination information
     * @return page of audit records for the specified user
     */
    Page<Audit> findByUserId(UUID userId, Pageable pageable);

    /**
     * Find audit records by cluster ID.
     * 
     * @param clusterId the cluster ID to filter by
     * @param pageable  pagination information
     * @return page of audit records for the specified cluster
     */
    Page<Audit> findByClusterId(UUID clusterId, Pageable pageable);

    /**
     * Find audit records after a specific timestamp.
     * 
     * @param timestamp the timestamp threshold
     * @param pageable  pagination information
     * @return page of audit records after the specified timestamp
     */
    Page<Audit> findByTimestampAfter(Instant timestamp, Pageable pageable);

    /**
     * Find audit records before a specific timestamp.
     * 
     * @param timestamp the timestamp threshold
     * @param pageable  pagination information
     * @return page of audit records before the specified timestamp
     */
    Page<Audit> findByTimestampBefore(Instant timestamp, Pageable pageable);

    /**
     * Complex filtering method that supports multiple optional parameters.
     * All parameters are optional and will be ignored if null.
     * 
     * @param username      partial username to search for (case-insensitive)
     * @param clusterName   partial cluster name to search for (case-insensitive)
     * @param operationType specific operation type to filter by
     * @param status        specific operation status to filter by
     * @param resourceName  partial resource name to search for (case-insensitive)
     * @param resourceType  specific resource type to filter by (case-insensitive)
     * @param startTime     start of timestamp range (inclusive)
     * @param endTime       end of timestamp range (inclusive)
     * @param pageable      pagination information
     * @return page of audit records matching the specified criteria
     */
    /**
     * Find audit records by operation type and status.
     * 
     * @param operationType the operation type to filter by
     * @param status        the operation status to filter by
     * @param pageable      pagination information
     * @return page of audit records matching both criteria
     */
    Page<Audit> findByOperationTypeAndStatus(AuditOperationType operationType, AuditOperationStatus status,
            Pageable pageable);

    /**
     * Simple method signature for backward compatibility with tests.
     * This method will be implemented in the service layer to avoid PostgreSQL
     * parameter type issues.
     */
    default Page<Audit> findWithFilters(AuditOperationType operationType, AuditOperationStatus status,
            Instant startTime, Instant endTime, Pageable pageable) {
        // This default implementation should not be used - service layer overrides this
        throw new UnsupportedOperationException("Use service layer filtering instead");
    }

    /**
     * Count audit records by operation type.
     * 
     * @param operationType the operation type to count
     * @return number of audit records for the specified operation type
     */
    long countByOperationType(AuditOperationType operationType);

    /**
     * Count audit records by status.
     * 
     * @param status the operation status to count
     * @return number of audit records for the specified status
     */
    long countByStatus(AuditOperationStatus status);

    /**
     * Count audit records by user ID.
     * 
     * @param userId the user ID to count records for
     * @return number of audit records for the specified user
     */
    long countByUserId(UUID userId);

    /**
     * Count audit records by cluster ID.
     * 
     * @param clusterId the cluster ID to count records for
     * @return number of audit records for the specified cluster
     */
    long countByClusterId(UUID clusterId);

    /**
     * Find the most recent audit records.
     * 
     * @param pageable pagination information (should include sort by timestamp
     *                 desc)
     * @return page of most recent audit records
     */
    @Query("SELECT a FROM Audit a ORDER BY a.timestamp DESC")
    Page<Audit> findMostRecent(Pageable pageable);

    /**
     * Find audit records for failed operations.
     * 
     * @param pageable pagination information
     * @return page of audit records with FAILURE status
     */
    default Page<Audit> findFailedOperations(Pageable pageable) {
        return findByStatus(AuditOperationStatus.FAILURE, pageable);
    }

    /**
     * Find audit records for successful operations.
     * 
     * @param pageable pagination information
     * @return page of audit records with SUCCESS status
     */
    default Page<Audit> findSuccessfulOperations(Pageable pageable) {
        return findByStatus(AuditOperationStatus.SUCCESS, pageable);
    }

    /**
     * Find audit records for a specific user and cluster combination.
     * 
     * @param userId    the user ID
     * @param clusterId the cluster ID
     * @param pageable  pagination information
     * @return page of audit records for the user-cluster combination
     */
    @Query("SELECT a FROM Audit a WHERE a.user.id = :userId AND a.cluster.id = :clusterId")
    Page<Audit> findByUserIdAndClusterId(@Param("userId") UUID userId,
            @Param("clusterId") UUID clusterId,
            Pageable pageable);

    /**
     * Find audit records older than a specific timestamp (for cleanup purposes).
     * 
     * @param timestamp the timestamp threshold
     * @return list of audit records older than the specified timestamp
     */
    List<Audit> findByTimestampBefore(Instant timestamp);
}