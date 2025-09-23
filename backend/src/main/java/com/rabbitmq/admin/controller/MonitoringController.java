package com.rabbitmq.admin.controller;

import com.rabbitmq.admin.service.RabbitMQClusterHealthService;
import com.rabbitmq.admin.service.ResourceMetricsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for monitoring and metrics endpoints.
 * Provides access to resource metrics, cluster health, and performance
 * statistics.
 */
@RestController
@RequestMapping("/api/monitoring")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class MonitoringController {

    private static final Logger logger = LoggerFactory.getLogger(MonitoringController.class);

    private final ResourceMetricsService metricsService;
    private final RabbitMQClusterHealthService healthService;

    public MonitoringController(ResourceMetricsService metricsService,
            RabbitMQClusterHealthService healthService) {
        this.metricsService = metricsService;
        this.healthService = healthService;
    }

    /**
     * Get comprehensive resource metrics summary.
     */
    @GetMapping("/metrics/summary")
    public ResponseEntity<Map<String, Object>> getMetricsSummary() {
        logger.debug("Fetching metrics summary");

        Map<String, Object> summary = new HashMap<>();

        // Resource type metrics
        String[] resourceTypes = { "connections", "channels", "exchanges", "queues", "bindings" };
        Map<String, Map<String, Object>> resourceMetrics = new HashMap<>();

        for (String resourceType : resourceTypes) {
            Map<String, Object> typeMetrics = new HashMap<>();
            typeMetrics.put("totalRequests", metricsService.getTotalRequests(resourceType));
            typeMetrics.put("totalErrors", metricsService.getTotalErrors(resourceType));
            typeMetrics.put("errorRate", metricsService.getErrorRate(resourceType));
            typeMetrics.put("averageResponseTime", metricsService.getAverageResponseTime(resourceType));
            resourceMetrics.put(resourceType, typeMetrics);
        }

        summary.put("resourceMetrics", resourceMetrics);
        summary.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.ok(summary);
    }

    /**
     * Get metrics for a specific resource type.
     */
    @GetMapping("/metrics/{resourceType}")
    public ResponseEntity<Map<String, Object>> getResourceMetrics(@PathVariable String resourceType) {
        logger.debug("Fetching metrics for resource type: {}", resourceType);

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("resourceType", resourceType);
        metrics.put("totalRequests", metricsService.getTotalRequests(resourceType));
        metrics.put("totalErrors", metricsService.getTotalErrors(resourceType));
        metrics.put("errorRate", metricsService.getErrorRate(resourceType));
        metrics.put("averageResponseTime", metricsService.getAverageResponseTime(resourceType));
        metrics.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.ok(metrics);
    }

    /**
     * Get cluster health status for all clusters.
     */
    @GetMapping("/health/clusters")
    public ResponseEntity<Map<String, Object>> getAllClusterHealth() {
        logger.debug("Fetching health status for all clusters");

        Map<String, Object> healthStatus = new HashMap<>();
        healthStatus.put("clusters", healthService.getAllClusterHealthStatus());
        healthStatus.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.ok(healthStatus);
    }

    /**
     * Get health status for a specific cluster.
     */
    @GetMapping("/health/clusters/{clusterId}")
    public Mono<ResponseEntity<Map<String, Object>>> getClusterHealth(@PathVariable UUID clusterId) {
        logger.debug("Fetching health status for cluster: {}", clusterId);

        return healthService.checkClusterHealth(clusterId)
                .map(status -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("clusterId", clusterId.toString());
                    response.put("healthy", status.isHealthy());
                    response.put("message", status.message());
                    response.put("lastChecked", status.lastChecked().toString());
                    response.put("responseTime",
                            status.responseTime() != null ? status.responseTime().toMillis() + "ms" : null);
                    response.put("clusterName", status.clusterName());
                    response.put("timestamp", java.time.Instant.now().toString());

                    return ResponseEntity.ok(response);
                })
                .onErrorResume(error -> {
                    logger.error("Failed to get cluster health for {}: {}", clusterId, error.getMessage());
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("clusterId", clusterId.toString());
                    errorResponse.put("error", "Failed to check cluster health: " + error.getMessage());
                    errorResponse.put("timestamp", java.time.Instant.now().toString());

                    return Mono.just(ResponseEntity.status(500).body(errorResponse));
                });
    }

    /**
     * Refresh health status for all clusters.
     */
    @PostMapping("/health/clusters/refresh")
    public ResponseEntity<Map<String, Object>> refreshAllClusterHealth() {
        logger.info("Refreshing health status for all clusters");

        try {
            healthService.refreshAllClusterHealth();

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cluster health refresh initiated");
            response.put("timestamp", java.time.Instant.now().toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to refresh cluster health", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to refresh cluster health: " + e.getMessage());
            errorResponse.put("timestamp", java.time.Instant.now().toString());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Refresh health status for a specific cluster.
     */
    @PostMapping("/health/clusters/{clusterId}/refresh")
    public Mono<ResponseEntity<Map<String, Object>>> refreshClusterHealth(@PathVariable UUID clusterId) {
        logger.info("Refreshing health status for cluster: {}", clusterId);

        return healthService.refreshClusterHealth(clusterId)
                .map(status -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("clusterId", clusterId.toString());
                    response.put("message", "Cluster health refreshed");
                    response.put("healthy", status.isHealthy());
                    response.put("timestamp", java.time.Instant.now().toString());

                    return ResponseEntity.ok(response);
                })
                .onErrorResume(error -> {
                    logger.error("Failed to refresh cluster health for {}: {}", clusterId, error.getMessage());
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("clusterId", clusterId.toString());
                    errorResponse.put("error", "Failed to refresh cluster health: " + error.getMessage());
                    errorResponse.put("timestamp", java.time.Instant.now().toString());

                    return Mono.just(ResponseEntity.status(500).body(errorResponse));
                });
    }

    /**
     * Get performance statistics and thresholds.
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceStats() {
        logger.debug("Fetching performance statistics");

        Map<String, Object> performance = new HashMap<>();

        // Performance thresholds (these could be configurable)
        Map<String, Object> thresholds = new HashMap<>();
        thresholds.put("maxResponseTimeMs", 5000);
        thresholds.put("maxErrorRate", 0.05); // 5%
        thresholds.put("warningResponseTimeMs", 2000);
        thresholds.put("warningErrorRate", 0.02); // 2%

        // Current performance metrics
        Map<String, Object> current = new HashMap<>();
        String[] resourceTypes = { "connections", "channels", "exchanges", "queues", "bindings" };

        for (String resourceType : resourceTypes) {
            Map<String, Object> typePerf = new HashMap<>();
            double avgResponseTime = metricsService.getAverageResponseTime(resourceType);
            double errorRate = metricsService.getErrorRate(resourceType);

            typePerf.put("averageResponseTime", avgResponseTime);
            typePerf.put("errorRate", errorRate);

            // Performance status
            String status = "GOOD";
            if (avgResponseTime > 5000 || errorRate > 0.05) {
                status = "CRITICAL";
            } else if (avgResponseTime > 2000 || errorRate > 0.02) {
                status = "WARNING";
            }
            typePerf.put("status", status);

            current.put(resourceType, typePerf);
        }

        performance.put("thresholds", thresholds);
        performance.put("current", current);
        performance.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.ok(performance);
    }
}