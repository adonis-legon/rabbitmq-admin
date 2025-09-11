package com.rabbitmq.admin.dto;

import com.rabbitmq.admin.model.UserRole;
import jakarta.validation.constraints.Size;

import java.util.Set;
import java.util.UUID;

/**
 * DTO for updating an existing user.
 */
public class UpdateUserRequest {

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    private UserRole role;

    private Set<UUID> clusterConnectionIds;

    public UpdateUserRequest() {
    }

    public UpdateUserRequest(String username, String password, UserRole role, Set<UUID> clusterConnectionIds) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.clusterConnectionIds = clusterConnectionIds;
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

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Set<UUID> getClusterConnectionIds() {
        return clusterConnectionIds;
    }

    public void setClusterConnectionIds(Set<UUID> clusterConnectionIds) {
        this.clusterConnectionIds = clusterConnectionIds;
    }
}