package com.rabbitmq.admin.service;

import com.rabbitmq.admin.config.MonitoringProperties;
import com.rabbitmq.admin.model.ClusterConnection;
import com.rabbitmq.admin.repository.ClusterConnectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class RabbitMQClusterHealthServiceTest {

    @Mock
    private ClusterConnectionRepository clusterRepository;

    @Mock
    private RabbitMQProxyService proxyService;

    @Mock
    private ResourceMetricsService metricsService;

    @Mock
    private MonitoringProperties monitoringProperties;

    @Mock
    private MonitoringProperties.Health healthConfig;

    private RabbitMQClusterHealthService healthService;

    @BeforeEach
    void setUp() {
        // Setup default monitoring properties with lenient mocks to avoid unnecessary
        // stubbing errors
        lenient().when(monitoringProperties.getHealth()).thenReturn(healthConfig);
        lenient().when(healthConfig.getCheckIntervalMinutes()).thenReturn(2);
        lenient().when(healthConfig.getTimeoutSeconds()).thenReturn(10);

        healthService = new RabbitMQClusterHealthService(clusterRepository, proxyService, metricsService,
                monitoringProperties);
    }

    @Test
    void shouldReturnUpHealthWhenAllClustersHealthy() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "test-cluster", true);

        when(clusterRepository.findByActiveTrue()).thenReturn(List.of(cluster));
        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(proxyService.get(eq(clusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.just(Map.of("rabbitmq_version", "3.9.0")));

        // When
        Map<String, Object> health = healthService.getOverallHealth();

        // Then
        assertEquals("UP", health.get("status"));
        assertEquals(1L, health.get("totalClusters"));
        assertEquals(1L, health.get("healthyClusters"));
        assertEquals(0L, health.get("unhealthyClusters"));
    }

    @Test
    void shouldReturnDownHealthWhenAllClustersUnhealthy() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "test-cluster", true);

        when(clusterRepository.findByActiveTrue()).thenReturn(List.of(cluster));
        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(proxyService.get(eq(clusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.error(new RuntimeException("Connection failed")));

        // When
        Map<String, Object> health = healthService.getOverallHealth();

        // Then
        assertEquals("DOWN", health.get("status"));
        assertEquals(1L, health.get("totalClusters"));
        assertEquals(0L, health.get("healthyClusters"));
        assertEquals(1L, health.get("unhealthyClusters"));

        verify(metricsService).recordClusterConnectivityError();
    }

    @Test
    void shouldReturnDegradedHealthWhenSomeClustersUnhealthy() {
        // Given
        UUID healthyClusterId = UUID.randomUUID();
        UUID unhealthyClusterId = UUID.randomUUID();
        ClusterConnection healthyCluster = createClusterConnection(healthyClusterId, "healthy-cluster", true);
        ClusterConnection unhealthyCluster = createClusterConnection(unhealthyClusterId, "unhealthy-cluster", true);

        when(clusterRepository.findByActiveTrue()).thenReturn(List.of(healthyCluster, unhealthyCluster));
        when(clusterRepository.findById(healthyClusterId)).thenReturn(Optional.of(healthyCluster));
        when(clusterRepository.findById(unhealthyClusterId)).thenReturn(Optional.of(unhealthyCluster));

        when(proxyService.get(eq(healthyClusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.just(Map.of("rabbitmq_version", "3.9.0")));
        when(proxyService.get(eq(unhealthyClusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.error(new RuntimeException("Connection failed")));

        // When
        Map<String, Object> health = healthService.getOverallHealth();

        // Then
        assertEquals("DEGRADED", health.get("status"));
        assertEquals(2L, health.get("totalClusters"));
        assertEquals(1L, health.get("healthyClusters"));
        assertEquals(1L, health.get("unhealthyClusters"));
    }

    @Test
    void shouldReturnUnknownHealthWhenNoClusters() {
        // Given
        when(clusterRepository.findByActiveTrue()).thenReturn(List.of());

        // When
        Map<String, Object> health = healthService.getOverallHealth();

        // Then
        assertEquals("UNKNOWN", health.get("status"));
        assertEquals("No clusters configured", health.get("message"));
    }

    @Test
    void shouldCheckSpecificClusterHealth() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "test-cluster", true);

        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(proxyService.get(eq(clusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.just(Map.of("rabbitmq_version", "3.9.0")));

        // When
        StepVerifier.create(healthService.checkClusterHealth(clusterId))
                .assertNext(status -> {
                    assertTrue(status.isHealthy());
                    assertEquals(clusterId, status.clusterId());
                    assertEquals("Cluster is healthy", status.message());
                    assertEquals("test-cluster", status.clusterName());
                    assertNotNull(status.responseTime());
                })
                .verifyComplete();
    }

    @Test
    void shouldHandleInactiveCluster() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "inactive-cluster", false);

        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));

        // When
        StepVerifier.create(healthService.checkClusterHealth(clusterId))
                .assertNext(status -> {
                    assertFalse(status.isHealthy());
                    assertEquals(clusterId, status.clusterId());
                    assertEquals("Cluster is inactive", status.message());
                    assertNull(status.responseTime());
                })
                .verifyComplete();
    }

    @Test
    void shouldHandleClusterNotFound() {
        // Given
        UUID clusterId = UUID.randomUUID();
        when(clusterRepository.findById(clusterId)).thenReturn(Optional.empty());

        // When
        StepVerifier.create(healthService.checkClusterHealth(clusterId))
                .assertNext(status -> {
                    assertFalse(status.isHealthy());
                    assertEquals(clusterId, status.clusterId());
                    assertTrue(status.message().contains("Cluster not found"));
                })
                .verifyComplete();
    }

    @Test
    void shouldHandleHealthCheckTimeout() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "timeout-cluster", true);

        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        // Create a Mono that will timeout - delay longer than the configured timeout
        when(proxyService.get(eq(clusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.delay(Duration.ofSeconds(15)).then(Mono.just(Map.of())));

        // When - The service will block and timeout internally, so we test the result
        Mono<RabbitMQClusterHealthService.ClusterHealthStatus> result = healthService.checkClusterHealth(clusterId);

        StepVerifier.create(result)
                .assertNext(status -> {
                    assertFalse(status.isHealthy());
                    assertEquals(clusterId, status.clusterId());
                    assertTrue(status.message().contains("Health check failed") ||
                            status.message().contains("timeout") ||
                            status.message().contains("TimeoutException"));
                })
                .verifyComplete();

        verify(metricsService).recordClusterConnectivityError();
    }

    @Test
    void shouldRefreshAllClusterHealth() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "test-cluster", true);

        when(clusterRepository.findByActiveTrue()).thenReturn(List.of(cluster));
        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(proxyService.get(eq(clusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.just(Map.of("rabbitmq_version", "3.9.0")));

        // When
        assertDoesNotThrow(() -> healthService.refreshAllClusterHealth());

        // Then
        Map<UUID, RabbitMQClusterHealthService.ClusterHealthStatus> healthStatus = healthService
                .getAllClusterHealthStatus();
        assertTrue(healthStatus.containsKey(clusterId));
        assertTrue(healthStatus.get(clusterId).isHealthy());
    }

    @Test
    void shouldRefreshSpecificClusterHealth() {
        // Given
        UUID clusterId = UUID.randomUUID();
        ClusterConnection cluster = createClusterConnection(clusterId, "test-cluster", true);

        when(clusterRepository.findById(clusterId)).thenReturn(Optional.of(cluster));
        when(proxyService.get(eq(clusterId), eq("/api/overview"), eq(Object.class), isNull()))
                .thenReturn(Mono.just(Map.of("rabbitmq_version", "3.9.0")));

        // When
        StepVerifier.create(healthService.refreshClusterHealth(clusterId))
                .assertNext(status -> {
                    assertTrue(status.isHealthy());
                    assertEquals(clusterId, status.clusterId());
                })
                .verifyComplete();
    }

    private ClusterConnection createClusterConnection(UUID id, String name, boolean active) {
        ClusterConnection cluster = new ClusterConnection();
        cluster.setId(id);
        cluster.setName(name);
        cluster.setActive(active);
        cluster.setApiUrl("http://localhost:15672");
        cluster.setUsername("guest");
        cluster.setPassword("guest");
        return cluster;
    }
}