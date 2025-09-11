package com.rabbitmq.admin.service;

import com.rabbitmq.admin.model.ClusterConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Service for managing HTTP clients for RabbitMQ Management API connections.
 * Maintains a dynamic pool of WebClient instances, one per cluster connection.
 */
@Service
public class RabbitMQClientService {

    private static final Logger logger = LoggerFactory.getLogger(RabbitMQClientService.class);

    private static final int MAX_IN_MEMORY_SIZE = 1024 * 1024; // 1MB

    private final ConcurrentMap<String, WebClient> clientPool = new ConcurrentHashMap<>();

    /**
     * Gets or creates a WebClient for the specified cluster connection.
     * 
     * @param clusterConnection the cluster connection configuration
     * @return WebClient configured for the cluster
     */
    public WebClient getClient(ClusterConnection clusterConnection) {
        if (clusterConnection == null || clusterConnection.getId() == null) {
            throw new IllegalArgumentException("Cluster connection and ID cannot be null");
        }

        String clusterId = clusterConnection.getId().toString();

        return clientPool.computeIfAbsent(clusterId, key -> createWebClient(clusterConnection));
    }

    /**
     * Updates the client for a cluster connection. This is called when cluster
     * connection details are modified.
     * 
     * @param clusterConnection the updated cluster connection configuration
     */
    public void updateClient(ClusterConnection clusterConnection) {
        if (clusterConnection == null || clusterConnection.getId() == null) {
            throw new IllegalArgumentException("Cluster connection and ID cannot be null");
        }

        String clusterId = clusterConnection.getId().toString();

        logger.info("Updating WebClient for cluster: {}", clusterId);

        // Remove old client and create new one
        clientPool.remove(clusterId);
        clientPool.put(clusterId, createWebClient(clusterConnection));
    }

    /**
     * Removes a client from the pool when a cluster connection is deleted.
     * 
     * @param clusterId the cluster connection ID
     */
    public void removeClient(String clusterId) {
        if (clusterId == null) {
            return;
        }

        logger.info("Removing WebClient for cluster: {}", clusterId);
        clientPool.remove(clusterId);
    }

    /**
     * Tests connectivity to a RabbitMQ cluster by making a simple API call.
     * 
     * @param clusterConnection the cluster connection to test
     * @return Mono<Boolean> indicating if the connection is successful
     */
    public Mono<Boolean> testConnection(ClusterConnection clusterConnection) {
        if (clusterConnection == null) {
            return Mono.just(false);
        }

        try {
            WebClient client = getClient(clusterConnection);

            return client.get()
                    .uri("/api/overview")
                    .retrieve()
                    .bodyToMono(String.class)
                    .map(response -> true)
                    .onErrorReturn(false)
                    .timeout(Duration.ofSeconds(10));

        } catch (Exception e) {
            logger.error("Error testing connection to cluster {}: {}",
                    clusterConnection.getId(), e.getMessage());
            return Mono.just(false);
        }
    }

    /**
     * Makes a GET request to the RabbitMQ Management API.
     * 
     * @param clusterConnection the cluster connection
     * @param path              the API path (e.g., "/api/queues")
     * @param responseType      the expected response type
     * @return Mono with the response
     */
    public <T> Mono<T> get(ClusterConnection clusterConnection, String path, Class<T> responseType) {
        WebClient client = getClient(clusterConnection);

        return client.get()
                .uri(path)
                .retrieve()
                .bodyToMono(responseType)
                .doOnError(error -> logger.error("GET request failed for cluster {} path {}: {}",
                        clusterConnection.getId(), path, error.getMessage()));
    }

    /**
     * Makes a POST request to the RabbitMQ Management API.
     * 
     * @param clusterConnection the cluster connection
     * @param path              the API path
     * @param body              the request body
     * @param responseType      the expected response type
     * @return Mono with the response
     */
    public <T> Mono<T> post(ClusterConnection clusterConnection, String path, Object body, Class<T> responseType) {
        WebClient client = getClient(clusterConnection);

        return client.post()
                .uri(path)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(responseType)
                .doOnError(error -> logger.error("POST request failed for cluster {} path {}: {}",
                        clusterConnection.getId(), path, error.getMessage()));
    }

    /**
     * Makes a PUT request to the RabbitMQ Management API.
     * 
     * @param clusterConnection the cluster connection
     * @param path              the API path
     * @param body              the request body
     * @param responseType      the expected response type
     * @return Mono with the response
     */
    public <T> Mono<T> put(ClusterConnection clusterConnection, String path, Object body, Class<T> responseType) {
        WebClient client = getClient(clusterConnection);

        return client.put()
                .uri(path)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(responseType)
                .doOnError(error -> logger.error("PUT request failed for cluster {} path {}: {}",
                        clusterConnection.getId(), path, error.getMessage()));
    }

    /**
     * Makes a DELETE request to the RabbitMQ Management API.
     * 
     * @param clusterConnection the cluster connection
     * @param path              the API path
     * @return Mono<Void> for the response
     */
    public Mono<Void> delete(ClusterConnection clusterConnection, String path) {
        WebClient client = getClient(clusterConnection);

        return client.delete()
                .uri(path)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnError(error -> logger.error("DELETE request failed for cluster {} path {}: {}",
                        clusterConnection.getId(), path, error.getMessage()));
    }

    /**
     * Gets the current size of the client pool.
     * 
     * @return the number of active clients
     */
    public int getPoolSize() {
        return clientPool.size();
    }

    /**
     * Clears all clients from the pool. Used for testing or shutdown.
     */
    public void clearPool() {
        logger.info("Clearing WebClient pool, removing {} clients", clientPool.size());
        clientPool.clear();
    }

    /**
     * Creates a new WebClient configured for the given cluster connection.
     * 
     * @param clusterConnection the cluster connection configuration
     * @return configured WebClient
     */
    private WebClient createWebClient(ClusterConnection clusterConnection) {
        if (!clusterConnection.isAccessible()) {
            throw new IllegalStateException("Cluster connection is not active: " + clusterConnection.getId());
        }

        String baseUrl = clusterConnection.getApiUrl();
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }

        // Create Basic Auth header
        String credentials = clusterConnection.getUsername() + ":" + clusterConnection.getPassword();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        String authHeader = "Basic " + encodedCredentials;

        logger.debug("Creating WebClient for cluster {} with base URL: {}",
                clusterConnection.getId(), baseUrl);

        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, authHeader)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE))
                .build();
    }
}