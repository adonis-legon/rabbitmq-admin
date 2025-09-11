package com.rabbitmq.admin.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entity representing a RabbitMQ cluster connection configuration.
 * Contains connection details and credentials for accessing RabbitMQ Management
 * API.
 */
@Entity
@Table(name = "cluster_connections")
public class ClusterConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Cluster name is required")
    @Size(min = 1, max = 100, message = "Cluster name must be between 1 and 100 characters")
    private String name;

    @Column(nullable = false, length = 500)
    @NotBlank(message = "API URL is required")
    @Pattern(regexp = "^https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+$", message = "API URL must be a valid HTTP or HTTPS URL")
    private String apiUrl;

    @Column(nullable = false, length = 100)
    @NotBlank(message = "Username is required")
    @Size(min = 1, max = 100, message = "Username must be between 1 and 100 characters")
    private String username;

    @Column(nullable = false, length = 500)
    @NotBlank(message = "Password is required")
    private String password;

    @Column(length = 500)
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Column(nullable = false)
    @NotNull(message = "Active status is required")
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @ManyToMany(mappedBy = "assignedClusters", fetch = FetchType.LAZY)
    private Set<User> assignedUsers = new HashSet<>();

    // Default constructor
    public ClusterConnection() {
    }

    // Constructor for creating new cluster connections
    public ClusterConnection(String name, String apiUrl, String username, String password) {
        this.name = name;
        this.apiUrl = apiUrl;
        this.username = username;
        this.password = password;
        this.active = true;
    }

    // Constructor with description
    public ClusterConnection(String name, String apiUrl, String username, String password, String description) {
        this(name, apiUrl, username, password);
        this.description = description;
    }

    // Getters and setters
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Set<User> getAssignedUsers() {
        return assignedUsers;
    }

    public void setAssignedUsers(Set<User> assignedUsers) {
        this.assignedUsers = assignedUsers;
    }

    // Utility methods for managing user assignments
    public void addUser(User user) {
        this.assignedUsers.add(user);
        user.getAssignedClusters().add(this);
    }

    public void removeUser(User user) {
        this.assignedUsers.remove(user);
        user.getAssignedClusters().remove(this);
    }

    // Utility method to check if cluster is accessible
    public boolean isAccessible() {
        return active != null && active;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof ClusterConnection))
            return false;
        ClusterConnection that = (ClusterConnection) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "ClusterConnection{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", apiUrl='" + apiUrl + '\'' +
                ", username='" + username + '\'' +
                ", active=" + active +
                ", createdAt=" + createdAt +
                '}';
    }
}