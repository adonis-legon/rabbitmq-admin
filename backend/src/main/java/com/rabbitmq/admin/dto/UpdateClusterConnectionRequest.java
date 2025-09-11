package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.*;

import java.util.Set;
import java.util.UUID;

/**
 * Request DTO for updating an existing cluster connection.
 */
public class UpdateClusterConnectionRequest {

    @Size(min = 1, max = 100, message = "Cluster name must be between 1 and 100 characters")
    private String name;

    @Pattern(regexp = "^https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+$", message = "API URL must be a valid HTTP or HTTPS URL")
    private String apiUrl;

    @Size(min = 1, max = 100, message = "Username must be between 1 and 100 characters")
    private String username;

    private String password;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private Boolean active;

    private Set<UUID> assignedUserIds;

    public UpdateClusterConnectionRequest() {
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public Set<UUID> getAssignedUserIds() {
        return assignedUserIds;
    }

    public void setAssignedUserIds(Set<UUID> assignedUserIds) {
        this.assignedUserIds = assignedUserIds;
    }
}