package com.rabbitmq.admin.exception;

/**
 * Exception thrown when attempting to create a resource that already exists.
 */
public class DuplicateResourceException extends RuntimeException {

    private final String resourceType;
    private final String resourceIdentifier;

    public DuplicateResourceException(String resourceType, String resourceIdentifier) {
        super(String.format("%s already exists: %s", resourceType, resourceIdentifier));
        this.resourceType = resourceType;
        this.resourceIdentifier = resourceIdentifier;
    }

    public DuplicateResourceException(String message) {
        super(message);
        this.resourceType = null;
        this.resourceIdentifier = null;
    }

    public DuplicateResourceException(String resourceType, String resourceIdentifier, Throwable cause) {
        super(String.format("%s already exists: %s", resourceType, resourceIdentifier), cause);
        this.resourceType = resourceType;
        this.resourceIdentifier = resourceIdentifier;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceIdentifier() {
        return resourceIdentifier;
    }

    public static DuplicateResourceException username(String username) {
        return new DuplicateResourceException("Username", username);
    }

    public static DuplicateResourceException clusterName(String clusterName) {
        return new DuplicateResourceException("Cluster connection name", clusterName);
    }
}