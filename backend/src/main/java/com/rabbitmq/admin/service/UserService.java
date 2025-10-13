package com.rabbitmq.admin.service;

import com.rabbitmq.admin.exception.DuplicateResourceException;
import com.rabbitmq.admin.exception.UserNotFoundException;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Service class for user management operations.
 * Handles CRUD operations, password validation, and cluster assignments.
 */
@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final ClusterConnectionRepository clusterConnectionRepository;
    private final PasswordEncoder passwordEncoder;

    // Password strength pattern: minimum 8 characters, at least one uppercase,
    // lowercase, number, and special character
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

    public UserService(UserRepository userRepository,
            ClusterConnectionRepository clusterConnectionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clusterConnectionRepository = clusterConnectionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Create a new user with password validation and hashing.
     * 
     * @param username the username for the new user
     * @param password the plain text password
     * @param role     the user role
     * @return the created user
     * @throws IllegalArgumentException if username exists or password is weak
     */
    public User createUser(String username, String password, UserRole role) {
        // Validate username uniqueness
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw DuplicateResourceException.username(username);
        }

        // Validate password strength
        validatePasswordStrength(password);

        // Create and save user
        User user = new User(username, passwordEncoder.encode(password), role);
        return userRepository.save(user);
    }

    /**
     * Update an existing user.
     * 
     * @param userId   the ID of the user to update
     * @param username the new username (optional)
     * @param password the new password (optional)
     * @param role     the new role (optional)
     * @return the updated user
     * @throws IllegalArgumentException if user not found or username conflicts
     */
    public User updateUser(UUID userId, String username, String password, UserRole role) {
        User user = getUserById(userId);

        // Update username if provided and different
        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsernameIgnoreCase(username)) {
                throw DuplicateResourceException.username(username);
            }
            user.setUsername(username);
        }

        // Update password if provided
        if (password != null && !password.trim().isEmpty()) {
            validatePasswordStrength(password);
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        // Update role if provided
        if (role != null) {
            user.setRole(role);
        }

        return userRepository.save(user);
    }

    /**
     * Get user by ID.
     * 
     * @param userId the user ID
     * @return the user
     * @throws IllegalArgumentException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> UserNotFoundException.byId(userId.toString()));
    }

    /**
     * Get user by username.
     * 
     * @param username the username
     * @return Optional containing the user if found
     */
    @Transactional(readOnly = true)
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
    }

    /**
     * Get all users.
     * 
     * @return list of all users
     */
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get users by role.
     * 
     * @param role the user role
     * @return list of users with the specified role
     */
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    /**
     * Delete a user by ID.
     * 
     * @param userId the user ID
     * @throws IllegalArgumentException if user not found
     */
    public void deleteUser(UUID userId) {
        User user = getUserById(userId);

        // Remove user from all cluster assignments before deletion
        Set<ClusterConnection> currentClusters = new HashSet<>(user.getAssignedClusters());
        for (ClusterConnection cluster : currentClusters) {
            user.removeClusterConnection(cluster);
        }
        userRepository.save(user);

        userRepository.delete(user);
    }

    /**
     * Assign a cluster connection to a user.
     * 
     * @param userId              the user ID
     * @param clusterConnectionId the cluster connection ID
     * @throws IllegalArgumentException if user or cluster not found
     */
    public void assignClusterToUser(UUID userId, UUID clusterConnectionId) {
        User user = getUserById(userId);
        ClusterConnection clusterConnection = clusterConnectionRepository.findById(clusterConnectionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Cluster connection not found with ID: " + clusterConnectionId));

        user.addClusterConnection(clusterConnection);
        userRepository.save(user);
    }

    /**
     * Remove a cluster connection assignment from a user.
     * 
     * @param userId              the user ID
     * @param clusterConnectionId the cluster connection ID
     * @throws IllegalArgumentException if user or cluster not found
     */
    public void removeClusterFromUser(UUID userId, UUID clusterConnectionId) {
        User user = getUserById(userId);
        ClusterConnection clusterConnection = clusterConnectionRepository.findById(clusterConnectionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Cluster connection not found with ID: " + clusterConnectionId));

        user.removeClusterConnection(clusterConnection);
        userRepository.save(user);
    }

    /**
     * Update user's cluster assignments.
     * 
     * @param userId               the user ID
     * @param clusterConnectionIds set of cluster connection IDs to assign
     * @throws IllegalArgumentException if user not found or invalid cluster IDs
     */
    public void updateUserClusterAssignments(UUID userId, Set<UUID> clusterConnectionIds) {
        User user = getUserById(userId);

        // Clear existing assignments properly maintaining bidirectional relationship
        Set<ClusterConnection> currentClusters = new HashSet<>(user.getAssignedClusters());
        for (ClusterConnection cluster : currentClusters) {
            user.removeClusterConnection(cluster);
        }

        // Add new assignments
        if (clusterConnectionIds != null && !clusterConnectionIds.isEmpty()) {
            for (UUID clusterConnectionId : clusterConnectionIds) {
                ClusterConnection clusterConnection = clusterConnectionRepository.findById(clusterConnectionId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Cluster connection not found with ID: " + clusterConnectionId));
                user.addClusterConnection(clusterConnection);
            }
        }

        userRepository.save(user);
    }

    /**
     * Get users assigned to a specific cluster connection.
     * 
     * @param clusterConnectionId the cluster connection ID
     * @return list of users assigned to the cluster
     */
    @Transactional(readOnly = true)
    public List<User> getUsersAssignedToCluster(UUID clusterConnectionId) {
        return userRepository.findByAssignedClustersId(clusterConnectionId);
    }

    /**
     * Get users not assigned to a specific cluster connection.
     * 
     * @param clusterConnectionId the cluster connection ID
     * @return list of users not assigned to the cluster
     */
    @Transactional(readOnly = true)
    public List<User> getUsersNotAssignedToCluster(UUID clusterConnectionId) {
        return userRepository.findUsersNotAssignedToCluster(clusterConnectionId);
    }

    /**
     * Get users with no cluster assignments.
     * 
     * @return list of users with no assigned clusters
     */
    @Transactional(readOnly = true)
    public List<User> getUsersWithNoClusterAssignments() {
        return userRepository.findUsersWithNoClusterAssignments();
    }

    /**
     * Check if username exists (case-insensitive).
     * 
     * @param username the username to check
     * @return true if username exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean usernameExists(String username) {
        return userRepository.existsByUsernameIgnoreCase(username);
    }

    /**
     * Count users by role.
     * 
     * @param role the user role
     * @return number of users with the specified role
     */
    @Transactional(readOnly = true)
    public long countUsersByRole(UserRole role) {
        return userRepository.countByRole(role);
    }

    /**
     * Unlock a user account (admin operation).
     * 
     * @param userId the ID of the user to unlock
     * @return the updated user
     * @throws IllegalArgumentException if user not found
     */
    public User unlockUser(UUID userId) {
        User user = getUserById(userId);

        if (user.isLocked()) {
            user.unlockUser();
            User savedUser = userRepository.save(user);
            logger.info("User {} has been unlocked by administrator", user.getUsername());
            return savedUser;
        }

        return user;
    }

    /**
     * Get locked users count.
     * 
     * @return the number of locked users
     */
    @Transactional(readOnly = true)
    public long getLockedUsersCount() {
        return userRepository.countByLocked(true);
    }

    /**
     * Get all locked users.
     * 
     * @return list of locked users
     */
    @Transactional(readOnly = true)
    public List<User> getLockedUsers() {
        return userRepository.findByLockedTrue();
    }

    /**
     * Validate password strength according to security requirements.
     * 
     * @param password the password to validate
     * @throws IllegalArgumentException if password doesn't meet requirements
     */
    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException(
                    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)");
        }
    }
}