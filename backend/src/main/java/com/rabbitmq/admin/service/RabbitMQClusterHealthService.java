package com.rabbitmq.admin.service;

import com.rabbitmq.admin.config.MonitoringProperties;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Service for monitoring RabbitMQ cluster health and connectivity.
 * Provides health checks and connectivity status for all configured clusters.
 */
@Service
public class RabbitMQClusterHealthService {

    private static final Logger logger = LoggerFactory.getLogger(RabbitMQClusterHealthService.class);

    private final ClusterConnectionRepository clusterRepository;
    private final RabbitMQProxyService proxyService;
    private final ResourceMetricsService metricsService;
    private final MonitoringProperties monitoringProperties;

    // Cache for cluster health status
    private final ConcurrentHashMap<UUID, ClusterHealthStatus> healthCache = new ConcurrentHashMap<>();
    private final AtomicReference<Instant> lastGlobalHealthCheck = new AtomicReference<>(Instant.MIN);

    public RabbitMQClusterHealthService(
            ClusterConnectionRepository clusterRepository,
            RabbitMQProxyService proxyService,
            ResourceMetricsService metricsService,
            MonitoringProperties monitoringProperties) {
        this.clusterRepository = clusterRepository;
        this.proxyService = proxyService;
        this.metricsService = metricsService;
        this.monitoringProperties = monitoringProperties;
    }

    /**
     * Gets the overall health status of all clusters.
     */
    public Map<String, Object> getOverallHealth() {
        try {
            Instant now = Instant.now();
            Instant lastCheck = lastGlobalHealthCheck.get();

            // Only perform health check if cache is expired
            Duration cacheDuration = Duration.ofMinutes(monitoringProperties.getHealth().getCheckIntervalMinutes());
            if (Duration.between(lastCheck, now).compareTo(cacheDuration) > 0) {
                performGlobalHealthCheck();
                lastGlobalHealthCheck.set(now);
            }

            return buildHealthStatus();
        } catch (Exception e) {
            logger.error("Error during global health check", e);
            Map<String, Object> errorHealth = new HashMap<>();
            errorHealth.put("status", "DOWN");
            errorHealth.put("error", "Failed to perform health check: " + e.getMessage());
            return errorHealth;
        }
    }

    /**
     * Checks the health of a specific cluster.
     */
    public Mono<ClusterHealthStatus> checkClusterHealth(UUID clusterId) {
        return Mono.fromCallable(() -> {
            ClusterHealthStatus cachedStatus = healthCache.get(clusterId);
            Instant now = Instant.now();

            // Return cached status if still valid
            Duration cacheDuration = Duration.ofMinutes(monitoringProperties.getHealth().getCheckIntervalMinutes());
            if (cachedStatus != null &&
                    Duration.between(cachedStatus.lastChecked(), now).compareTo(cacheDuration) <= 0) {
                return cachedStatus;
            }

            // Perform fresh health check
            return performClusterHealthCheck(clusterId);
        });
    }

    /**
     * Gets the current health status for all clusters.
     */
    public Map<UUID, ClusterHealthStatus> getAllClusterHealthStatus() {
        return Map.copyOf(healthCache);
    }

    /**
     * Forces a health check refresh for all clusters.
     */
    public void refreshAllClusterHealth() {
        logger.info("Refreshing health status for all clusters");
        performGlobalHealthCheck();
        lastGlobalHealthCheck.set(Instant.now());
    }

    /**
     * Forces a health check refresh for a specific cluster.
     */
    public Mono<ClusterHealthStatus> refreshClusterHealth(UUID clusterId) {
        return Mono.fromCallable(() -> {
            logger.debug("Refreshing health status for cluster {}", clusterId);
            ClusterHealthStatus status = performClusterHealthCheck(clusterId);
            healthCache.put(clusterId, status);
            return status;
        });
    }

    private void performGlobalHealthCheck() {
        List<ClusterConnection> clusters = clusterRepository.findByActiveTrue();

        logger.debug("Performing health check for {} active clusters", clusters.size());

        for (ClusterConnection cluster : clusters) {
            try {
                ClusterHealthStatus status = performClusterHealthCheck(cluster.getId());
                healthCache.put(cluster.getId(), status);
            } catch (Exception e) {
                logger.error("Failed to check health for cluster {}: {}", cluster.getId(), e.getMessage());
                ClusterHealthStatus errorStatus = new ClusterHealthStatus(
                        cluster.getId(),
                        false,
                        "Health check failed: " + e.getMessage(),
                        Instant.now(),
                        null,
                        null);
                healthCache.put(cluster.getId(), errorStatus);
                // Error already recorded in performClusterHealthCheck
            }
        }
    }

    private ClusterHealthStatus performClusterHealthCheck(UUID clusterId) {
        Instant startTime = Instant.now();

        try {
            ClusterConnection cluster = clusterRepository.findById(clusterId)
                    .orElseThrow(() -> new IllegalArgumentException("Cluster not found: " + clusterId));

            if (!cluster.getActive()) {
                return new ClusterHealthStatus(
                        clusterId,
                        false,
                        "Cluster is inactive",
                        Instant.now(),
                        null,
                        null);
            }

            // Perform a simple API call to check connectivity
            // We'll use the overview endpoint as it's lightweight
            Duration healthCheckTimeout = Duration.ofSeconds(monitoringProperties.getHealth().getTimeoutSeconds());
            Mono<Object> healthCheckMono = proxyService.get(clusterId, "/api/overview", Object.class, null)
                    .timeout(healthCheckTimeout)
                    .doOnSuccess(result -> logger.debug("Health check successful for cluster {}", clusterId))
                    .doOnError(error -> logger.warn("Health check failed for cluster {}: {}", clusterId,
                            error.getMessage()));

            // Block for health check (this is acceptable for health checks)
            Object result = healthCheckMono.block();

            Duration responseTime = Duration.between(startTime, Instant.now());

            if (result != null) {
                return new ClusterHealthStatus(
                        clusterId,
                        true,
                        "Cluster is healthy",
                        Instant.now(),
                        responseTime,
                        cluster.getName());
            } else {
                return new ClusterHealthStatus(
                        clusterId,
                        false,
                        "No response from cluster",
                        Instant.now(),
                        responseTime,
                        cluster.getName());
            }

        } catch (Exception e) {
            Duration responseTime = Duration.between(startTime, Instant.now());
            logger.error("Health check failed for cluster {}: {}", clusterId, e.getMessage());
            metricsService.recordClusterConnectivityError();

            return new ClusterHealthStatus(
                    clusterId,
                    false,
                    "Health check failed: " + e.getMessage(),
                    Instant.now(),
                    responseTime,
                    null);
        }
    }

    private Map<String, Object> buildHealthStatus() {
        Map<String, Object> health = new HashMap<>();

        if (healthCache.isEmpty()) {
            health.put("status", "UNKNOWN");
            health.put("message", "No clusters configured");
            return health;
        }

        long healthyClusters = healthCache.values().stream()
                .mapToLong(status -> status.isHealthy() ? 1 : 0)
                .sum();

        long totalClusters = healthCache.size();

        String status;
        if (healthyClusters == totalClusters) {
            status = "UP";
        } else if (healthyClusters == 0) {
            status = "DOWN";
        } else {
            status = "DEGRADED";
        }

        health.put("status", status);
        health.put("totalClusters", totalClusters);
        health.put("healthyClusters", healthyClusters);
        health.put("unhealthyClusters", totalClusters - healthyClusters);
        health.put("clusters", buildClusterDetails());

        return health;
    }

    private Map<String, Object> buildClusterDetails() {
        Map<String, Object> clusterDetails = new HashMap<>();

        healthCache.forEach((clusterId, status) -> {
            Map<String, Object> details = new HashMap<>();
            details.put("healthy", status.isHealthy());
            details.put("message", status.message());
            details.put("lastChecked", status.lastChecked().toString());
            details.put("responseTime",
                    status.responseTime() != null ? status.responseTime().toMillis() + "ms" : "N/A");
            details.put("name", status.clusterName() != null ? status.clusterName() : "Unknown");

            clusterDetails.put(clusterId.toString(), details);
        });

        return clusterDetails;
    }

    /**
     * Record representing the health status of a RabbitMQ cluster.
     */
    public record ClusterHealthStatus(
            UUID clusterId,
            boolean isHealthy,
            String message,
            Instant lastChecked,
            Duration responseTime,
            String clusterName) {
    }
}