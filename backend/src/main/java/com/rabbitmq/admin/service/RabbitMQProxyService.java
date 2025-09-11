package com.rabbitmq.admin.service;

import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.model.User;
import com.rabbitmq.admin.model.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Service for proxying requests to RabbitMQ Management API with user access
 * validation.
 * Routes requests to appropriate clusters and ensures users can only access
 * assigned clusters.
 */
@Service
public class RabbitMQProxyService {

    private static final Logger logger = LoggerFactory.getLogger(RabbitMQProxyService.class);

    private final RabbitMQClientService clientService;
    private final ClusterConnectionService clusterConnectionService;

    public RabbitMQProxyService(RabbitMQClientService clientService,
            ClusterConnectionService clusterConnectionService) {
        this.clientService = clientService;
        this.clusterConnectionService = clusterConnectionService;
    }

    /**
     * Makes a GET request to the RabbitMQ Management API with user access
     * validation.
     * 
     * @param clusterId    the cluster connection ID
     * @param path         the API path (e.g., "/api/queues")
     * @param responseType the expected response type
     * @param currentUser  the current authenticated user
     * @return Mono with the response
     * @throws AccessDeniedException    if user doesn't have access to the cluster
     * @throws IllegalArgumentException if cluster not found or inactive
     */
    public <T> Mono<T> get(UUID clusterId, String path, Class<T> responseType, User currentUser) {
        return validateUserAccessAndGetCluster(clusterId, currentUser)
                .flatMap(cluster -> {
                    logger.debug("Making GET request to cluster {} path {} for user {}",
                            clusterId, path, currentUser.getUsername());

                    return clientService.get(cluster, path, responseType)
                            .doOnError(error -> logger.error("GET request failed for cluster {} path {}: {}",
                                    clusterId, path, error.getMessage()))
                            .onErrorMap(this::mapToProxyException);
                });
    }

    /**
     * Makes a POST request to the RabbitMQ Management API with user access
     * validation.
     * 
     * @param clusterId    the cluster connection ID
     * @param path         the API path
     * @param body         the request body
     * @param responseType the expected response type
     * @param currentUser  the current authenticated user
     * @return Mono with the response
     * @throws AccessDeniedException    if user doesn't have access to the cluster
     * @throws IllegalArgumentException if cluster not found or inactive
     */
    public <T> Mono<T> post(UUID clusterId, String path, Object body, Class<T> responseType, User currentUser) {
        return validateUserAccessAndGetCluster(clusterId, currentUser)
                .flatMap(cluster -> {
                    logger.debug("Making POST request to cluster {} path {} for user {}",
                            clusterId, path, currentUser.getUsername());

                    return clientService.post(cluster, path, body, responseType)
                            .doOnError(error -> logger.error("POST request failed for cluster {} path {}: {}",
                                    clusterId, path, error.getMessage()))
                            .onErrorMap(this::mapToProxyException);
                });
    }

    /**
     * Makes a PUT request to the RabbitMQ Management API with user access
     * validation.
     * 
     * @param clusterId    the cluster connection ID
     * @param path         the API path
     * @param body         the request body
     * @param responseType the expected response type
     * @param currentUser  the current authenticated user
     * @return Mono with the response
     * @throws AccessDeniedException    if user doesn't have access to the cluster
     * @throws IllegalArgumentException if cluster not found or inactive
     */
    public <T> Mono<T> put(UUID clusterId, String path, Object body, Class<T> responseType, User currentUser) {
        return validateUserAccessAndGetCluster(clusterId, currentUser)
                .flatMap(cluster -> {
                    logger.debug("Making PUT request to cluster {} path {} for user {}",
                            clusterId, path, currentUser.getUsername());

                    return clientService.put(cluster, path, body, responseType)
                            .doOnError(error -> logger.error("PUT request failed for cluster {} path {}: {}",
                                    clusterId, path, error.getMessage()))
                            .onErrorMap(this::mapToProxyException);
                });
    }

    /**
     * Makes a DELETE request to the RabbitMQ Management API with user access
     * validation.
     * 
     * @param clusterId   the cluster connection ID
     * @param path        the API path
     * @param currentUser the current authenticated user
     * @return Mono<Void> for the response
     * @throws AccessDeniedException    if user doesn't have access to the cluster
     * @throws IllegalArgumentException if cluster not found or inactive
     */
    public Mono<Void> delete(UUID clusterId, String path, User currentUser) {
        return validateUserAccessAndGetCluster(clusterId, currentUser)
                .flatMap(cluster -> {
                    logger.debug("Making DELETE request to cluster {} path {} for user {}",
                            clusterId, path, currentUser.getUsername());

                    return clientService.delete(cluster, path)
                            .doOnError(error -> logger.error("DELETE request failed for cluster {} path {}: {}",
                                    clusterId, path, error.getMessage()))
                            .onErrorMap(this::mapToProxyException);
                });
    }

    /**
     * Tests connectivity to a RabbitMQ cluster with user access validation.
     * 
     * @param clusterId   the cluster connection ID
     * @param currentUser the current authenticated user
     * @return Mono<Boolean> indicating if the connection is successful
     * @throws AccessDeniedException    if user doesn't have access to the cluster
     * @throws IllegalArgumentException if cluster not found or inactive
     */
    public Mono<Boolean> testConnection(UUID clusterId, User currentUser) {
        return validateUserAccessAndGetCluster(clusterId, currentUser)
                .flatMap(cluster -> {
                    logger.debug("Testing connection to cluster {} for user {}",
                            clusterId, currentUser.getUsername());

                    return clientService.testConnection(cluster)
                            .doOnError(error -> logger.error("Connection test failed for cluster {}: {}",
                                    clusterId, error.getMessage()))
                            .onErrorReturn(false);
                });
    }

    /**
     * Validates that the current user has access to the specified cluster and
     * returns the cluster.
     * Administrators have access to all clusters, regular users only to assigned
     * clusters.
     * 
     * @param clusterId   the cluster connection ID
     * @param currentUser the current authenticated user
     * @return Mono<ClusterConnection> if access is granted
     * @throws AccessDeniedException    if user doesn't have access to the cluster
     * @throws IllegalArgumentException if cluster not found or inactive
     */
    private Mono<ClusterConnection> validateUserAccessAndGetCluster(UUID clusterId, User currentUser) {
        return Mono.fromCallable(() -> {
            if (clusterId == null) {
                throw new IllegalArgumentException("Cluster ID cannot be null");
            }

            if (currentUser == null) {
                throw new AccessDeniedException("User authentication required");
            }

            // Get cluster connection
            ClusterConnection cluster;
            try {
                cluster = clusterConnectionService.getClusterConnectionById(clusterId);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Cluster connection not found: " + clusterId);
            }

            // Check if cluster is active
            if (!cluster.isAccessible()) {
                throw new IllegalArgumentException("Cluster connection is not active: " + clusterId);
            }

            // Administrators have access to all clusters
            if (currentUser.getRole() == UserRole.ADMINISTRATOR) {
                logger.debug("Administrator {} granted access to cluster {}",
                        currentUser.getUsername(), clusterId);
                return cluster;
            }

            // Regular users only have access to assigned clusters
            boolean hasAccess = clusterConnectionService.userHasAccessToCluster(
                    currentUser.getId(), clusterId);

            if (!hasAccess) {
                logger.warn("User {} denied access to cluster {}",
                        currentUser.getUsername(), clusterId);
                throw new AccessDeniedException(
                        "Access denied: User does not have permission to access cluster " + clusterId);
            }

            logger.debug("User {} granted access to cluster {}",
                    currentUser.getUsername(), clusterId);
            return cluster;
        });
    }

    /**
     * Maps various exceptions to appropriate proxy exceptions with better error
     * messages.
     * 
     * @param throwable the original exception
     * @return mapped exception
     */
    private Throwable mapToProxyException(Throwable throwable) {
        if (throwable instanceof org.springframework.web.reactive.function.client.WebClientResponseException) {
            org.springframework.web.reactive.function.client.WebClientResponseException webEx = (org.springframework.web.reactive.function.client.WebClientResponseException) throwable;

            String message = "RabbitMQ API error: " + webEx.getStatusCode() + " - " + webEx.getStatusText();

            switch (webEx.getStatusCode().value()) {
                case 401:
                    message = "RabbitMQ API authentication failed - invalid cluster credentials";
                    break;
                case 403:
                    message = "RabbitMQ API access forbidden - insufficient cluster permissions";
                    break;
                case 404:
                    message = "RabbitMQ API endpoint not found";
                    break;
                case 500:
                    message = "RabbitMQ API internal server error";
                    break;
                case 503:
                    message = "RabbitMQ API service unavailable";
                    break;
            }

            return new RabbitMQProxyException(message, webEx);
        }

        if (throwable instanceof java.net.ConnectException) {
            return new RabbitMQProxyException("Unable to connect to RabbitMQ cluster", throwable);
        }

        if (throwable instanceof java.util.concurrent.TimeoutException) {
            return new RabbitMQProxyException("Request to RabbitMQ cluster timed out", throwable);
        }

        return new RabbitMQProxyException("Unexpected error communicating with RabbitMQ cluster", throwable);
    }

    /**
     * Custom exception for RabbitMQ proxy errors.
     */
    public static class RabbitMQProxyException extends RuntimeException {
        public RabbitMQProxyException(String message) {
            super(message);
        }

        public RabbitMQProxyException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}