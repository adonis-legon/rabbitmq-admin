package com.rabbitmq.admin.repository;

import com.rabbitmq.admin.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for managing User-ClusterConnection assignments.
 * Provides operations for the many-to-many relationship between users and
 * cluster connections.
 */
@Repository
public interface UserClusterAssignmentRepository extends JpaRepository<User, UUID> {

        /**
         * Assign a user to a cluster connection.
         * This method adds a relationship in the user_cluster_assignments table.
         * 
         * @param userId              the ID of the user
         * @param clusterConnectionId the ID of the cluster connection
         */
        @Modifying
        @Transactional
        @Query(value = "INSERT INTO user_cluster_assignments (user_id, cluster_connection_id) " +
                        "SELECT :userId, :clusterConnectionId " +
                        "WHERE EXISTS (SELECT 1 FROM users WHERE id = :userId) " +
                        "AND EXISTS (SELECT 1 FROM cluster_connections WHERE id = :clusterConnectionId) " +
                        "AND NOT EXISTS (SELECT 1 FROM user_cluster_assignments " +
                        "WHERE user_id = :userId AND cluster_connection_id = :clusterConnectionId)", nativeQuery = true)
        void assignUserToCluster(@Param("userId") UUID userId,
                        @Param("clusterConnectionId") UUID clusterConnectionId);

        /**
         * Remove a user assignment from a cluster connection.
         * This method removes a relationship from the user_cluster_assignments table.
         * 
         * @param userId              the ID of the user
         * @param clusterConnectionId the ID of the cluster connection
         */
        @Modifying
        @Transactional
        @Query(value = "DELETE FROM user_cluster_assignments " +
                        "WHERE user_id = :userId AND cluster_connection_id = :clusterConnectionId", nativeQuery = true)
        void removeUserFromCluster(@Param("userId") UUID userId,
                        @Param("clusterConnectionId") UUID clusterConnectionId);

        /**
         * Remove all user assignments for a specific cluster connection.
         * This is useful when deleting a cluster connection.
         * 
         * @param clusterConnectionId the ID of the cluster connection
         */
        @Modifying
        @Transactional
        @Query(value = "DELETE FROM user_cluster_assignments WHERE cluster_connection_id = :clusterConnectionId", nativeQuery = true)
        void removeAllUsersFromCluster(@Param("clusterConnectionId") UUID clusterConnectionId);

        /**
         * Remove all cluster assignments for a specific user.
         * This is useful when deleting a user.
         * 
         * @param userId the ID of the user
         */
        @Modifying
        @Transactional
        @Query(value = "DELETE FROM user_cluster_assignments WHERE user_id = :userId", nativeQuery = true)
        void removeAllClustersFromUser(@Param("userId") UUID userId);

        /**
         * Check if a user is assigned to a specific cluster connection.
         * 
         * @param userId              the ID of the user
         * @param clusterConnectionId the ID of the cluster connection
         * @return true if the user is assigned to the cluster, false otherwise
         */
        @Query(value = "SELECT COUNT(*) > 0 FROM user_cluster_assignments " +
                        "WHERE user_id = :userId AND cluster_connection_id = :clusterConnectionId", nativeQuery = true)
        boolean isUserAssignedToCluster(@Param("userId") UUID userId,
                        @Param("clusterConnectionId") UUID clusterConnectionId);

        /**
         * Get all user-cluster assignment pairs.
         * Returns a list of Object arrays where each array contains [userId,
         * clusterConnectionId].
         * 
         * @return list of user-cluster assignment pairs
         */
        @Query(value = "SELECT CAST(user_id AS VARCHAR), CAST(cluster_connection_id AS VARCHAR) FROM user_cluster_assignments", nativeQuery = true)
        List<Object[]> findAllAssignments();

        /**
         * Count total number of user-cluster assignments.
         * 
         * @return total number of assignments
         */
        @Query(value = "SELECT COUNT(*) FROM user_cluster_assignments", nativeQuery = true)
        long countTotalAssignments();

        /**
         * Count assignments for a specific user.
         * 
         * @param userId the ID of the user
         * @return number of cluster connections assigned to the user
         */
        @Query(value = "SELECT COUNT(*) FROM user_cluster_assignments WHERE user_id = :userId", nativeQuery = true)
        long countAssignmentsForUser(@Param("userId") UUID userId);

        /**
         * Count assignments for a specific cluster connection.
         * 
         * @param clusterConnectionId the ID of the cluster connection
         * @return number of users assigned to the cluster connection
         */
        @Query(value = "SELECT COUNT(*) FROM user_cluster_assignments WHERE cluster_connection_id = :clusterConnectionId", nativeQuery = true)
        long countAssignmentsForCluster(@Param("clusterConnectionId") UUID clusterConnectionId);

        /**
         * Batch assign multiple users to a cluster connection.
         * Note: This method should be implemented in the service layer by calling
         * assignUserToCluster for each user
         * to maintain database compatibility.
         * 
         * @param userIds             list of user IDs to assign
         * @param clusterConnectionId the ID of the cluster connection
         */
        default void batchAssignUsersToCluster(UUID[] userIds, UUID clusterConnectionId) {
                for (UUID userId : userIds) {
                        assignUserToCluster(userId, clusterConnectionId);
                }
        }

        /**
         * Batch assign a user to multiple cluster connections.
         * Note: This method should be implemented in the service layer by calling
         * assignUserToCluster for each cluster
         * to maintain database compatibility.
         * 
         * @param userId               the ID of the user
         * @param clusterConnectionIds list of cluster connection IDs to assign
         */
        default void batchAssignUserToClusters(UUID userId, UUID[] clusterConnectionIds) {
                for (UUID clusterConnectionId : clusterConnectionIds) {
                        assignUserToCluster(userId, clusterConnectionId);
                }
        }
}