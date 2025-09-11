package com.rabbitmq.admin.exception;

/**
 * Exception thrown when there are issues with cluster connections.
 */
public class ClusterConnectionException extends RuntimeException {

    private final String clusterId;

    public ClusterConnectionException(String message) {
        super(message);
        this.clusterId = null;
    }

    public ClusterConnectionException(String message, String clusterId) {
        super(message);
        this.clusterId = clusterId;
    }

    public ClusterConnectionException(String message, Throwable cause) {
        super(message, cause);
        this.clusterId = null;
    }

    public ClusterConnectionException(String message, String clusterId, Throwable cause) {
        super(message, cause);
        this.clusterId = clusterId;
    }

    public String getClusterId() {
        return clusterId;
    }

    public static ClusterConnectionException inactive(String clusterId) {
        return new ClusterConnectionException("Cluster connection is not active", clusterId);
    }

    public static ClusterConnectionException connectionFailed(String clusterId, Throwable cause) {
        return new ClusterConnectionException("Failed to connect to cluster", clusterId, cause);
    }

    public static ClusterConnectionException testFailed(String clusterId, String reason) {
        return new ClusterConnectionException("Connection test failed: " + reason, clusterId);
    }
}