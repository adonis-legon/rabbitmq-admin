package com.rabbitmq.admin.dto;

import com.rabbitmq.admin.model.ClusterConnection;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Response DTO for cluster connection information.
 */
public class ClusterConnectionResponse {

    private UUID id;
    private String name;
    private String apiUrl;
    private String username;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private Set<UserSummary> assignedUsers;

    public ClusterConnectionResponse() {
    }

    public ClusterConnectionResponse(UUID id, String name, String apiUrl, String username,
            String description, Boolean active, LocalDateTime createdAt,
            Set<UserSummary> assignedUsers) {
        this.id = id;
        this.name = name;
        this.apiUrl = apiUrl;
        this.username = username;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
        this.assignedUsers = assignedUsers;
    }

    /**
     * Create a ClusterConnectionResponse from a ClusterConnection entity.
     * Note: Password is excluded for security reasons.
     */
    public static ClusterConnectionResponse fromClusterConnection(ClusterConnection cluster) {
        Set<UserSummary> userSummaries = cluster.getAssignedUsers().stream()
                .map(UserSummary::fromUser)
                .collect(Collectors.toSet());

        return new ClusterConnectionResponse(
                cluster.getId(),
                cluster.getName(),
                cluster.getApiUrl(),
                cluster.getUsername(),
                cluster.getDescription(),
                cluster.getActive(),
                cluster.getCreatedAt(),
                userSummaries);
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

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<UserSummary> getAssignedUsers() {
        return assignedUsers;
    }

    public void setAssignedUsers(Set<UserSummary> assignedUsers) {
        this.assignedUsers = assignedUsers;
    }

    /**
     * Summary information for users in cluster connection responses
     */
    public static class UserSummary {
        private UUID id;
        private String username;
        private String role;

        public UserSummary() {
        }

        public UserSummary(UUID id, String username, String role) {
            this.id = id;
            this.username = username;
            this.role = role;
        }

        public static UserSummary fromUser(com.rabbitmq.admin.model.User user) {
            return new UserSummary(
                    user.getId(),
                    user.getUsername(),
                    user.getRole().name());
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

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}