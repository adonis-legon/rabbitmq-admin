package com.rabbitmq.admin.dto;

import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for user information in authentication responses.
 */
public class UserInfo {

    private UUID id;
    private String username;
    private UserRole role;
    private LocalDateTime createdAt;

    public UserInfo() {
    }

    public UserInfo(UUID id, String username, UserRole role, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.createdAt = createdAt;
    }

    /**
     * Create UserInfo from User entity
     */
    public static UserInfo fromUser(User user) {
        return new UserInfo(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getCreatedAt());
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
}