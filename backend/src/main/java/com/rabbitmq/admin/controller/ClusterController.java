package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.dto.*;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.security.UserPrincipal;
import com.rabbitmq.admin.service.ClusterConnectionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for cluster connection management operations.
 */
@RestController
@RequestMapping("/api/clusters")
public class ClusterController {

    private static final Logger logger = LoggerFactory.getLogger(ClusterController.class);
    private final ClusterConnectionService clusterConnectionService;

    public ClusterController(ClusterConnectionService clusterConnectionService) {
        this.clusterConnectionService = clusterConnectionService;
    }

    /**
     * Get all cluster connections
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getAllClusterConnections() {
        List<ClusterConnection> clusters = clusterConnectionService.getAllClusterConnections();
        List<ClusterConnectionResponse> responses = clusters.stream()
                .map(ClusterConnectionResponse::fromClusterConnection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get active cluster connections only
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getActiveClusterConnections() {
        List<ClusterConnection> clusters = clusterConnectionService.getActiveClusterConnections();
        List<ClusterConnectionResponse> responses = clusters.stream()
                .map(ClusterConnectionResponse::fromClusterConnection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * 
     * Get cluster connection by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ClusterConnectionResponse> getClusterConnectionById(@PathVariable UUID id) {
        ClusterConnection cluster = clusterConnectionService.getClusterConnectionById(id);
        return ResponseEntity.ok(ClusterConnectionResponse.fromClusterConnection(cluster));
    }

    /**
     * Create a new cluster connection
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ClusterConnectionResponse> createClusterConnection(
            @Valid @RequestBody CreateClusterConnectionRequest request) {
        ClusterConnection cluster = clusterConnectionService.createClusterConnection(
                request.getName(),
                request.getApiUrl(),
                request.getUsername(),
                request.getPassword(),
                request.getDescription(),
                request.getActive());

        // Assign users if provided (including empty array to remove all users)
        if (request.getAssignedUserIds() != null) {
            clusterConnectionService.updateClusterUserAssignments(cluster.getId(), request.getAssignedUserIds());
            // Reload cluster to get updated user assignments
            cluster = clusterConnectionService.getClusterConnectionById(cluster.getId());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ClusterConnectionResponse.fromClusterConnection(cluster));
    }

    /**
     * Update an existing cluster connection
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ClusterConnectionResponse> updateClusterConnection(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateClusterConnectionRequest request) {
        ClusterConnection cluster = clusterConnectionService.updateClusterConnection(
                id,
                request.getName(),
                request.getApiUrl(),
                request.getUsername(),
                request.getPassword(),
                request.getDescription(),
                request.getActive());

        // Update user assignments if provided
        if (request.getAssignedUserIds() != null) {
            logger.info("Updating user assignments for cluster {}: {}", id, request.getAssignedUserIds());
            clusterConnectionService.updateClusterUserAssignments(id, request.getAssignedUserIds());
            // Reload cluster to get updated user assignments
            cluster = clusterConnectionService.getClusterConnectionById(id);
            logger.info("Cluster {} now has {} assigned users", id, cluster.getAssignedUsers().size());
        }

        return ResponseEntity.ok(ClusterConnectionResponse.fromClusterConnection(cluster));
    }

    /**
     * Delete a cluster connection
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Void> deleteClusterConnection(@PathVariable UUID id) {
        clusterConnectionService.deleteClusterConnection(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Test connection to RabbitMQ API with provided credentials
     */
    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ConnectionTestResponse> testConnection(
            @Valid @RequestBody ConnectionTestRequest request) {
        ConnectionTestResponse response = clusterConnectionService.testConnection(
                request.getApiUrl(),
                request.getUsername(),
                request.getPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * Test connection for an existing cluster connection
     */
    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ConnectionTestResponse> testClusterConnection(@PathVariable UUID id) {
        ConnectionTestResponse response = clusterConnectionService.testClusterConnection(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Assign a user to a cluster connection
     */
    @PostMapping("/{clusterId}/users/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Void> assignUserToCluster(
            @PathVariable UUID clusterId,
            @PathVariable UUID userId) {
        clusterConnectionService.assignUserToCluster(clusterId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Remove a user assignment from a cluster connection
     */
    @DeleteMapping("/{clusterId}/users/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Void> removeUserFromCluster(
            @PathVariable UUID clusterId,
            @PathVariable UUID userId) {
        clusterConnectionService.removeUserFromCluster(clusterId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get users assigned to a specific cluster connection
     */
    @GetMapping("/{clusterId}/users")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<UserResponse>> getUsersAssignedToCluster(@PathVariable UUID clusterId) {
        var users = clusterConnectionService.getUsersAssignedToCluster(clusterId);
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Get users not assigned to a specific cluster connection
     */
    @GetMapping("/{clusterId}/users/unassigned")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<UserResponse>> getUsersNotAssignedToCluster(@PathVariable UUID clusterId) {
        var users = clusterConnectionService.getUsersNotAssignedToCluster(clusterId);
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Check if cluster name exists
     */
    @GetMapping("/exists/{name}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<Boolean> checkClusterNameExists(@PathVariable String name) {
        boolean exists = clusterConnectionService.clusterNameExists(name);
        return ResponseEntity.ok(exists);
    }

    /**
     * Get cluster connections for a specific user
     */
    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getClusterConnectionsForUser(@PathVariable UUID userId) {
        List<ClusterConnection> clusters = clusterConnectionService.getClusterConnectionsForUser(userId);
        List<ClusterConnectionResponse> responses = clusters.stream()
                .map(ClusterConnectionResponse::fromClusterConnection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get active cluster connections for a specific user
     */
    @GetMapping("/by-user/{userId}/active")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getActiveClusterConnectionsForUser(
            @PathVariable UUID userId) {
        List<ClusterConnection> clusters = clusterConnectionService.getActiveClusterConnectionsForUser(userId);
        List<ClusterConnectionResponse> responses = clusters.stream()
                .map(ClusterConnectionResponse::fromClusterConnection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get cluster connections for the current authenticated user.
     * Accessible by any authenticated user (USER or ADMINISTRATOR role).
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getMyClusterConnections(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID currentUserId = userPrincipal.getId();
        List<ClusterConnection> clusters = clusterConnectionService.getClusterConnectionsForUser(currentUserId);
        List<ClusterConnectionResponse> responses = clusters.stream()
                .map(ClusterConnectionResponse::fromClusterConnection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get active cluster connections for the current authenticated user.
     * Accessible by any authenticated user (USER or ADMINISTRATOR role).
     */
    @GetMapping("/my/active")
    @PreAuthorize("hasRole('USER') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getMyActiveClusterConnections(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UUID currentUserId = userPrincipal.getId();
        List<ClusterConnection> clusters = clusterConnectionService.getActiveClusterConnectionsForUser(currentUserId);
        List<ClusterConnectionResponse> responses = clusters.stream()
                .map(ClusterConnectionResponse::fromClusterConnection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}