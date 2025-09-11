package com.rabbitmq.admin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entity representing a user in the RabbitMQ Admin system.
 * Users can have different roles and can be assigned to multiple cluster
 * connections.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Username can only contain letters, numbers, underscores, and hyphens")
    private String username;

    @Column(nullable = false)
    @NotBlank(message = "Password hash is required")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "User role is required")
    private UserRole role;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_cluster_assignments", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "cluster_connection_id"))
    private Set<ClusterConnection> assignedClusters = new HashSet<>();

    // Default constructor
    public User() {
    }

    // Constructor for creating new users
    public User(String username, String passwordHash, UserRole role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    // Getters and setters
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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

    public Set<ClusterConnection> getAssignedClusters() {
        return assignedClusters;
    }

    public void setAssignedClusters(Set<ClusterConnection> assignedClusters) {
        this.assignedClusters = assignedClusters;
    }

    // Utility methods for managing cluster assignments
    public void addClusterConnection(ClusterConnection clusterConnection) {
        this.assignedClusters.add(clusterConnection);
        clusterConnection.getAssignedUsers().add(this);
    }

    public void removeClusterConnection(ClusterConnection clusterConnection) {
        this.assignedClusters.remove(clusterConnection);
        clusterConnection.getAssignedUsers().remove(this);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof User))
            return false;
        User user = (User) o;
        return id != null && id.equals(user.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", role=" + role +
                ", createdAt=" + createdAt +
                '}';
    }
}