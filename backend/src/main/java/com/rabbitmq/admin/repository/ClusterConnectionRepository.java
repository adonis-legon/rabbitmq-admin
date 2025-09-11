package com.rabbitmq.admin.repository;

import com.rabbitmq.admin.model.ClusterConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ClusterConnection entity operations.
 * Provides CRUD operations and custom query methods for cluster connection
 * management.
 */
@Repository
public interface ClusterConnectionRepository extends JpaRepository<ClusterConnection, UUID> {

    /**
     * Find a cluster connection by name (case-insensitive).
     * 
     * @param name the cluster name to search for
     * @return Optional containing the cluster connection if found, empty otherwise
     */
    Optional<ClusterConnection> findByNameIgnoreCase(String name);

    /**
     * Check if a cluster connection exists with the given name (case-insensitive).
     * 
     * @param name the cluster name to check
     * @return true if cluster connection exists, false otherwise
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Find all active cluster connections.
     * 
     * @return list of active cluster connections
     */
    List<ClusterConnection> findByActiveTrue();

    /**
     * Find all inactive cluster connections.
     * 
     * @return list of inactive cluster connections
     */
    List<ClusterConnection> findByActiveFalse();

    /**
     * Find cluster connections assigned to a specific user.
     * 
     * @param userId the ID of the user
     * @return list of cluster connections assigned to the user
     */
    @Query("SELECT c FROM ClusterConnection c JOIN c.assignedUsers u WHERE u.id = :userId")
    List<ClusterConnection> findByAssignedUsersId(@Param("userId") UUID userId);

    /**
     * Find active cluster connections assigned to a specific user.
     * 
     * @param userId the ID of the user
     * @return list of active cluster connections assigned to the user
     */
    @Query("SELECT c FROM ClusterConnection c JOIN c.assignedUsers u WHERE u.id = :userId AND c.active = true")
    List<ClusterConnection> findActiveClustersByUserId(@Param("userId") UUID userId);

    /**
     * Find cluster connections not assigned to a specific user.
     * 
     * @param userId the ID of the user
     * @return list of cluster connections not assigned to the user
     */
    @Query("SELECT c FROM ClusterConnection c WHERE c.id NOT IN " +
            "(SELECT c2.id FROM ClusterConnection c2 JOIN c2.assignedUsers u WHERE u.id = :userId)")
    List<ClusterConnection> findClustersNotAssignedToUser(@Param("userId") UUID userId);

    /**
     * Find cluster connections by API URL.
     * 
     * @param apiUrl the API URL to search for
     * @return list of cluster connections with the specified API URL
     */
    List<ClusterConnection> findByApiUrl(String apiUrl);

    /**
     * Find cluster connections with no user assignments.
     * 
     * @return list of cluster connections with no assigned users
     */
    @Query("SELECT c FROM ClusterConnection c WHERE c.assignedUsers IS EMPTY")
    List<ClusterConnection> findClustersWithNoUserAssignments();

    /**
     * Find cluster connections with at least one user assignment.
     * 
     * @return list of cluster connections with at least one assigned user
     */
    @Query("SELECT DISTINCT c FROM ClusterConnection c WHERE c.assignedUsers IS NOT EMPTY")
    List<ClusterConnection> findClustersWithUserAssignments();

    /**
     * Count cluster connections by active status.
     * 
     * @param active the active status to count
     * @return number of cluster connections with the specified active status
     */
    long countByActive(Boolean active);

    /**
     * Find cluster connections ordered by name.
     * 
     * @return list of all cluster connections ordered by name
     */
    List<ClusterConnection> findAllByOrderByNameAsc();

    /**
     * Find active cluster connections ordered by name.
     * 
     * @return list of active cluster connections ordered by name
     */
    List<ClusterConnection> findByActiveTrueOrderByNameAsc();

    /**
     * Count total number of active clusters.
     * 
     * @return number of active cluster connections
     */
    default long countActiveClusters() {
        return countByActive(true);
    }

    /**
     * Count total number of inactive clusters.
     * 
     * @return number of inactive cluster connections
     */
    default long countInactiveClusters() {
        return countByActive(false);
    }
}