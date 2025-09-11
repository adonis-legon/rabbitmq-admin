package com.rabbitmq.admin.dto;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DTO for user information in management responses.
 */
public class UserResponse {

    private UUID id;
    private String username;
    private UserRole role;
    private LocalDateTime createdAt;
    private Set<ClusterConnectionSummary> assignedClusters;

    public UserResponse() {
    }

    public UserResponse(UUID id, String username, UserRole role, LocalDateTime createdAt,
            Set<ClusterConnectionSummary> assignedClusters) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.createdAt = createdAt;
        this.assignedClusters = assignedClusters;
    }

    /**
     * Create UserResponse from User entity
     */
    public static UserResponse fromUser(User user) {
        Set<ClusterConnectionSummary> clusterSummaries = user.getAssignedClusters().stream()
                .map(ClusterConnectionSummary::fromClusterConnection)
                .collect(Collectors.toSet());

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getCreatedAt(),
                clusterSummaries);
    }

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

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<ClusterConnectionSummary> getAssignedClusters() {
        return assignedClusters;
    }

    public void setAssignedClusters(Set<ClusterConnectionSummary> assignedClusters) {
        this.assignedClusters = assignedClusters;
    }

    /**
     * Summary information for cluster connections in user responses
     */
    public static class ClusterConnectionSummary {
        private UUID id;
        private String name;
        private String description;
        private Boolean active;

        public ClusterConnectionSummary() {
        }

        public ClusterConnectionSummary(UUID id, String name, String description, Boolean active) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.active = active;
        }

        public static ClusterConnectionSummary fromClusterConnection(
                com.rabbitmq.admin.model.ClusterConnection cluster) {
            return new ClusterConnectionSummary(
                    cluster.getId(),
                    cluster.getName(),
                    cluster.getDescription(),
                    cluster.getActive());
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }
}