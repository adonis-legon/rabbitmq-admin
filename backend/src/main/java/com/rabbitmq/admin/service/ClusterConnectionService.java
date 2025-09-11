package com.rabbitmq.admin.service;

import com.rabbitmq.admin.dto.ConnectionTestResponse;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import com.rabbitmq.admin.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service class for cluster connection management operations.
 * Handles CRUD operations, connection testing, and user assignments.
 */
@Service
@Transactional
public class ClusterConnectionService {

    private final ClusterConnectionRepository clusterConnectionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    public ClusterConnectionService(ClusterConnectionRepository clusterConnectionRepository,
            UserRepository userRepository,
            RestTemplate restTemplate) {
        this.clusterConnectionRepository = clusterConnectionRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
    }

    /**
     * Create a new cluster connection.
     * 
     * @param name        the cluster name
     * @param apiUrl      the RabbitMQ API URL
     * @param username    the RabbitMQ username
     * @param password    the RabbitMQ password
     * @param description optional description
     * @param active      whether the cluster is active
     * @return the created cluster connection
     * @throws IllegalArgumentException if cluster name already exists
     */
    public ClusterConnection createClusterConnection(String name, String apiUrl, String username,
            String password, String description, Boolean active) {
        // Validate cluster name uniqueness
        if (clusterConnectionRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Cluster connection name already exists: " + name);
        }

        // Create and save cluster connection
        ClusterConnection clusterConnection = new ClusterConnection(name, apiUrl, username, password, description);
        if (active != null) {
            clusterConnection.setActive(active);
        }

        return clusterConnectionRepository.save(clusterConnection);
    }

    /**
     * Update an existing cluster connection.
     * 
     * @param clusterId   the cluster ID
     * @param name        the new name (optional)
     * @param apiUrl      the new API URL (optional)
     * @param username    the new username (optional)
     * @param password    the new password (optional)
     * @param description the new description (optional)
     * @param active      the new active status (optional)
     * @return the updated cluster connection
     * @throws IllegalArgumentException if cluster not found or name conflicts
     */
    public ClusterConnection updateClusterConnection(UUID clusterId, String name, String apiUrl,
            String username, String password, String description, Boolean active) {
        ClusterConnection clusterConnection = getClusterConnectionById(clusterId);

        // Update name if provided and different
        if (name != null && !name.equals(clusterConnection.getName())) {
            if (clusterConnectionRepository.existsByNameIgnoreCase(name)) {
                throw new IllegalArgumentException("Cluster connection name already exists: " + name);
            }
            clusterConnection.setName(name);
        }

        // Update other fields if provided
        if (apiUrl != null && !apiUrl.trim().isEmpty()) {
            clusterConnection.setApiUrl(apiUrl);
        }
        if (username != null && !username.trim().isEmpty()) {
            clusterConnection.setUsername(username);
        }
        if (password != null && !password.trim().isEmpty()) {
            clusterConnection.setPassword(password);
        }
        if (description != null) {
            clusterConnection.setDescription(description);
        }
        if (active != null) {
            clusterConnection.setActive(active);
        }

        return clusterConnectionRepository.save(clusterConnection);
    }

    /**
     * Get cluster connection by ID.
     * 
     * @param clusterId the cluster ID
     * @return the cluster connection
     * @throws IllegalArgumentException if cluster not found
     */
    @Transactional(readOnly = true)
    public ClusterConnection getClusterConnectionById(UUID clusterId) {
        return clusterConnectionRepository.findById(clusterId)
                .orElseThrow(() -> new IllegalArgumentException("Cluster connection not found with ID: " + clusterId));
    }

    /**
     * Get cluster connection by name.
     * 
     * @param name the cluster name
     * @return Optional containing the cluster connection if found
     */
    @Transactional(readOnly = true)
    public Optional<ClusterConnection> getClusterConnectionByName(String name) {
        return clusterConnectionRepository.findByNameIgnoreCase(name);
    }

    /**
     * Get all cluster connections.
     * 
     * @return list of all cluster connections
     */
    @Transactional(readOnly = true)
    public List<ClusterConnection> getAllClusterConnections() {
        return clusterConnectionRepository.findAllByOrderByNameAsc();
    }

    /**
     * Get all active cluster connections.
     * 
     * @return list of active cluster connections
     */
    @Transactional(readOnly = true)
    public List<ClusterConnection> getActiveClusterConnections() {
        return clusterConnectionRepository.findByActiveTrueOrderByNameAsc();
    }

    /**
     * Get cluster connections assigned to a specific user.
     * 
     * @param userId the user ID
     * @return list of cluster connections assigned to the user
     */
    @Transactional(readOnly = true)
    public List<ClusterConnection> getClusterConnectionsForUser(UUID userId) {
        return clusterConnectionRepository.findByAssignedUsersId(userId);
    }

    /**
     * Get active cluster connections assigned to a specific user.
     * 
     * @param userId the user ID
     * @return list of active cluster connections assigned to the user
     */
    @Transactional(readOnly = true)
    public List<ClusterConnection> getActiveClusterConnectionsForUser(UUID userId) {
        return clusterConnectionRepository.findActiveClustersByUserId(userId);
    }

    /**
     * Delete a cluster connection by ID.
     * 
     * @param clusterId the cluster ID
     * @throws IllegalArgumentException if cluster not found
     */
    public void deleteClusterConnection(UUID clusterId) {
        ClusterConnection clusterConnection = getClusterConnectionById(clusterId);

        // Remove cluster from all user assignments before deletion
        clusterConnection.getAssignedUsers().clear();
        clusterConnectionRepository.save(clusterConnection);

        clusterConnectionRepository.delete(clusterConnection);
    }

    /**
     * Assign a user to a cluster connection.
     * 
     * @param clusterId the cluster ID
     * @param userId    the user ID
     * @throws IllegalArgumentException if cluster or user not found
     */
    public void assignUserToCluster(UUID clusterId, UUID userId) {
        ClusterConnection clusterConnection = getClusterConnectionById(clusterId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        clusterConnection.addUser(user);
        clusterConnectionRepository.save(clusterConnection);
    }

    /**
     * Remove a user assignment from a cluster connection.
     * 
     * @param clusterId the cluster ID
     * @param userId    the user ID
     * @throws IllegalArgumentException if cluster or user not found
     */
    public void removeUserFromCluster(UUID clusterId, UUID userId) {
        ClusterConnection clusterConnection = getClusterConnectionById(clusterId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        clusterConnection.removeUser(user);
        clusterConnectionRepository.save(clusterConnection);
    }

    /**
     * Update cluster's user assignments.
     * 
     * @param clusterId the cluster ID
     * @param userIds   set of user IDs to assign
     * @throws IllegalArgumentException if cluster not found or invalid user IDs
     */
    public void updateClusterUserAssignments(UUID clusterId, Set<UUID> userIds) {
        ClusterConnection clusterConnection = getClusterConnectionById(clusterId);

        // Clear existing assignments
        clusterConnection.getAssignedUsers().clear();

        // Add new assignments
        if (userIds != null && !userIds.isEmpty()) {
            for (UUID userId : userIds) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
                clusterConnection.addUser(user);
            }
        }

        clusterConnectionRepository.save(clusterConnection);
    }

    /**
     * Test connection to RabbitMQ API.
     * 
     * @param apiUrl   the RabbitMQ API URL
     * @param username the RabbitMQ username
     * @param password the RabbitMQ password
     * @return connection test response with success status and details
     */

    public ConnectionTestResponse testConnection(String apiUrl, String username, String password) {
        long startTime = System.currentTimeMillis();

        try {
            // Prepare basic authentication header
            String auth = username + ":" + password;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Basic " + encodedAuth);
            headers.set("Content-Type", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Test connection by calling the overview endpoint
            String testUrl = apiUrl.endsWith("/") ? apiUrl + "api/overview" : apiUrl + "/api/overview";

            ResponseEntity<String> response = restTemplate.exchange(
                    testUrl,
                    HttpMethod.GET,
                    entity,
                    String.class);

            long responseTime = System.currentTimeMillis() - startTime;

            if (response.getStatusCode() == HttpStatus.OK) {
                return ConnectionTestResponse.success(
                        "Connection successful - RabbitMQ API is accessible",
                        responseTime);
            } else {
                return ConnectionTestResponse.failure(
                        "Connection failed with status: " + response.getStatusCode(),
                        "HTTP " + response.getStatusCode().value() + " - " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            String errorMessage = "Authentication failed or access denied";
            String errorDetails = "HTTP " + e.getStatusCode().value() + " - " + e.getStatusText();

            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                errorMessage = "Invalid credentials - authentication failed";
            } else if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                errorMessage = "Access forbidden - insufficient permissions";
            } else if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                errorMessage = "RabbitMQ Management API not found at the specified URL";
            }

            return ConnectionTestResponse.failure(errorMessage, errorDetails);

        } catch (ResourceAccessException e) {
            return ConnectionTestResponse.failure(
                    "Connection timeout or network error",
                    "Unable to reach the RabbitMQ API at: " + apiUrl + ". " + e.getMessage());

        } catch (Exception e) {
            return ConnectionTestResponse.failure(
                    "Unexpected error during connection test",
                    e.getMessage());
        }
    }

    /**
     * Test connection for an existing cluster connection.
     * 
     * @param clusterId the cluster ID
     * @return connection test response
     * @throws IllegalArgumentException if cluster not found
     */

    public ConnectionTestResponse testClusterConnection(UUID clusterId) {
        ClusterConnection clusterConnection = getClusterConnectionById(clusterId);
        return testConnection(clusterConnection.getApiUrl(), clusterConnection.getUsername(),
                clusterConnection.getPassword());
    }

    /**
     * Check if cluster connection name exists (case-insensitive).
     * 
     * @param name the cluster name to check
     * @return true if name exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean clusterNameExists(String name) {
        return clusterConnectionRepository.existsByNameIgnoreCase(name);
    }

    /**
     * Check if a user has access to a specific cluster connection.
     * 
     * @param userId    the user ID
     * @param clusterId the cluster ID
     * @return true if user has access, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean userHasAccessToCluster(UUID userId, UUID clusterId) {
        List<ClusterConnection> userClusters = clusterConnectionRepository.findByAssignedUsersId(userId);
        return userClusters.stream().anyMatch(cluster -> cluster.getId().equals(clusterId));
    }

    /**
     * Get users assigned to a specific cluster connection.
     * 
     * @param clusterId the cluster ID
     * @return list of users assigned to the cluster
     */
    @Transactional(readOnly = true)
    public List<User> getUsersAssignedToCluster(UUID clusterId) {
        return userRepository.findByAssignedClustersId(clusterId);
    }

    /**
     * Get users not assigned to a specific cluster connection.
     * 
     * @param clusterId the cluster ID
     * @return list of users not assigned to the cluster
     */
    @Transactional(readOnly = true)
    public List<User> getUsersNotAssignedToCluster(UUID clusterId) {
        return userRepository.findUsersNotAssignedToCluster(clusterId);
    }

    /**
     * Count cluster connections by active status.
     * 
     * @param active the active status
     * @return number of cluster connections with the specified status
     */
    @Transactional(readOnly = true)
    public long countClusterConnectionsByStatus(Boolean active) {
        return clusterConnectionRepository.countByActive(active);
    }
}