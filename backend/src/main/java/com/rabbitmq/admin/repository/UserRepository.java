package com.rabbitmq.admin.repository;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity operations.
 * Provides CRUD operations and custom query methods for user management.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find a user by username (case-insensitive).
     * 
     * @param username the username to search for
     * @return Optional containing the user if found, empty otherwise
     */
    Optional<User> findByUsernameIgnoreCase(String username);

    /**
     * Check if a user exists with the given username (case-insensitive).
     * 
     * @param username the username to check
     * @return true if user exists, false otherwise
     */
    boolean existsByUsernameIgnoreCase(String username);

    /**
     * Find all users with a specific role.
     * 
     * @param role the user role to filter by
     * @return list of users with the specified role
     */
    List<User> findByRole(UserRole role);

    /**
     * Find all users assigned to a specific cluster connection.
     * 
     * @param clusterConnectionId the ID of the cluster connection
     * @return list of users assigned to the cluster
     */
    @Query("SELECT u FROM User u JOIN u.assignedClusters c WHERE c.id = :clusterConnectionId")
    List<User> findByAssignedClustersId(@Param("clusterConnectionId") UUID clusterConnectionId);

    /**
     * Find all users not assigned to a specific cluster connection.
     * 
     * @param clusterConnectionId the ID of the cluster connection
     * @return list of users not assigned to the cluster
     */
    @Query("SELECT u FROM User u WHERE u.id NOT IN " +
            "(SELECT u2.id FROM User u2 JOIN u2.assignedClusters c WHERE c.id = :clusterConnectionId)")
    List<User> findUsersNotAssignedToCluster(@Param("clusterConnectionId") UUID clusterConnectionId);

    /**
     * Count users by role.
     * 
     * @param role the user role to count
     * @return number of users with the specified role
     */
    long countByRole(UserRole role);

    /**
     * Find users with no cluster assignments.
     * 
     * @return list of users with no assigned clusters
     */
    @Query("SELECT u FROM User u WHERE u.assignedClusters IS EMPTY")
    List<User> findUsersWithNoClusterAssignments();

    /**
     * Find users with at least one cluster assignment.
     * 
     * @return list of users with at least one assigned cluster
     */
    @Query("SELECT DISTINCT u FROM User u WHERE u.assignedClusters IS NOT EMPTY")
    List<User> findUsersWithClusterAssignments();

    /**
     * Find all administrators.
     * 
     * @return list of users with ADMINISTRATOR role
     */
    default List<User> findAdministrators() {
        return findByRole(UserRole.ADMINISTRATOR);
    }

    /**
     * Find all regular users.
     * 
     * @return list of users with USER role
     */
    default List<User> findRegularUsers() {
        return findByRole(UserRole.USER);
    }
}