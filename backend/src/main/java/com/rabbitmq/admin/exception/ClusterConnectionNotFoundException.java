package com.rabbitmq.admin.exception;

/**
 * Exception thrown when a cluster connection is not found in the system.
 */
public class ClusterConnectionNotFoundException extends RuntimeException {

    public ClusterConnectionNotFoundException(String message) {
        super(message);
    }

    public ClusterConnectionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ClusterConnectionNotFoundException byId(String id) {
        return new ClusterConnectionNotFoundException("Cluster connection not found with ID: " + id);
    }

    public static ClusterConnectionNotFoundException byName(String name) {
        return new ClusterConnectionNotFoundException("Cluster connection not found with name: " + name);
    }
}