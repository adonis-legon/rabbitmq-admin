package com.rabbitmq.admin.exception;

/**
 * Exception thrown when RabbitMQ API operations fail.
 */
public class RabbitMQApiException extends RuntimeException {

    private final String clusterId;
    private final int statusCode;

    public RabbitMQApiException(String message, String clusterId) {
        super(message);
        this.clusterId = clusterId;
        this.statusCode = 0;
    }

    public RabbitMQApiException(String message, String clusterId, int statusCode) {
        super(message);
        this.clusterId = clusterId;
        this.statusCode = statusCode;
    }

    public RabbitMQApiException(String message, String clusterId, Throwable cause) {
        super(message, cause);
        this.clusterId = clusterId;
        this.statusCode = 0;
    }

    public RabbitMQApiException(String message, String clusterId, int statusCode, Throwable cause) {
        super(message, cause);
        this.clusterId = clusterId;
        this.statusCode = statusCode;
    }

    public String getClusterId() {
        return clusterId;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public static RabbitMQApiException connectionTimeout(String clusterId) {
        return new RabbitMQApiException("Connection timeout to RabbitMQ API", clusterId);
    }

    public static RabbitMQApiException unauthorized(String clusterId) {
        return new RabbitMQApiException("Unauthorized access to RabbitMQ API", clusterId, 401);
    }

    public static RabbitMQApiException notFound(String clusterId, String resource) {
        return new RabbitMQApiException("Resource not found: " + resource, clusterId, 404);
    }

    public static RabbitMQApiException serverError(String clusterId, int statusCode, String message) {
        return new RabbitMQApiException("RabbitMQ API error: " + message, clusterId, statusCode);
    }
}