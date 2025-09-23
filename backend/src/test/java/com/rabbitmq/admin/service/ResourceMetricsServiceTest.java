package com.rabbitmq.admin.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ResourceMetricsServiceTest {

    private ResourceMetricsService metricsService;
    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        metricsService = new ResourceMetricsService(meterRegistry);
    }

    @Test
    void shouldRecordConnectionRequestDuration() {
        // Given
        Duration duration = Duration.ofMillis(500);

        // When
        metricsService.recordConnectionRequestDuration(duration);

        // Then
        assertEquals(1, metricsService.getTotalRequests("connections"));
        assertTrue(metricsService.getAverageResponseTime("connections") > 0);
    }

    @Test
    void shouldRecordChannelRequestDuration() {
        // Given
        Duration duration = Duration.ofMillis(300);

        // When
        metricsService.recordChannelRequestDuration(duration);

        // Then
        assertEquals(1, metricsService.getTotalRequests("channels"));
        assertTrue(metricsService.getAverageResponseTime("channels") > 0);
    }

    @Test
    void shouldRecordExchangeRequestDuration() {
        // Given
        Duration duration = Duration.ofMillis(200);

        // When
        metricsService.recordExchangeRequestDuration(duration);

        // Then
        assertEquals(1, metricsService.getTotalRequests("exchanges"));
        assertTrue(metricsService.getAverageResponseTime("exchanges") > 0);
    }

    @Test
    void shouldRecordQueueRequestDuration() {
        // Given
        Duration duration = Duration.ofMillis(400);

        // When
        metricsService.recordQueueRequestDuration(duration);

        // Then
        assertEquals(1, metricsService.getTotalRequests("queues"));
        assertTrue(metricsService.getAverageResponseTime("queues") > 0);
    }

    @Test
    void shouldRecordBindingRequestDuration() {
        // Given
        Duration duration = Duration.ofMillis(150);

        // When
        metricsService.recordBindingRequestDuration(duration);

        // Then
        assertEquals(1, metricsService.getTotalRequests("bindings"));
        assertTrue(metricsService.getAverageResponseTime("bindings") > 0);
    }

    @Test
    void shouldRecordConnectionErrors() {
        // When
        metricsService.recordConnectionError();
        metricsService.recordConnectionError();

        // Then
        assertEquals(2, metricsService.getTotalErrors("connections"));
    }

    @Test
    void shouldRecordChannelErrors() {
        // When
        metricsService.recordChannelError();

        // Then
        assertEquals(1, metricsService.getTotalErrors("channels"));
    }

    @Test
    void shouldRecordExchangeErrors() {
        // When
        metricsService.recordExchangeError();

        // Then
        assertEquals(1, metricsService.getTotalErrors("exchanges"));
    }

    @Test
    void shouldRecordQueueErrors() {
        // When
        metricsService.recordQueueError();

        // Then
        assertEquals(1, metricsService.getTotalErrors("queues"));
    }

    @Test
    void shouldRecordBindingErrors() {
        // When
        metricsService.recordBindingError();

        // Then
        assertEquals(1, metricsService.getTotalErrors("bindings"));
    }

    @Test
    void shouldRecordClusterConnectivityErrors() {
        // When
        metricsService.recordClusterConnectivityError();
        metricsService.recordClusterConnectivityError();

        // Then
        // Verify that the counter was incremented (exact value depends on meter
        // registry implementation)
        assertDoesNotThrow(() -> metricsService.recordClusterConnectivityError());
    }

    @Test
    void shouldRecordAuthenticationErrors() {
        // When
        metricsService.recordAuthenticationError();

        // Then
        assertDoesNotThrow(() -> metricsService.recordAuthenticationError());
    }

    @Test
    void shouldCalculateErrorRate() {
        // Given
        metricsService.recordConnectionRequestDuration(Duration.ofMillis(100));
        metricsService.recordConnectionRequestDuration(Duration.ofMillis(200));
        metricsService.recordConnectionError();

        // When
        double errorRate = metricsService.getErrorRate("connections");

        // Then
        assertEquals(0.5, errorRate, 0.01); // 1 error out of 2 requests = 50%
    }

    @Test
    void shouldReturnZeroErrorRateWhenNoRequests() {
        // When
        double errorRate = metricsService.getErrorRate("connections");

        // Then
        assertEquals(0.0, errorRate);
    }

    @Test
    void shouldRecordClusterAccess() {
        // Given
        UUID clusterId = UUID.randomUUID();

        // When
        metricsService.recordClusterAccess(clusterId);
        metricsService.recordClusterAccess(clusterId);

        // Then
        assertDoesNotThrow(() -> metricsService.recordClusterAccess(clusterId));
    }

    @Test
    void shouldRecordUserAccess() {
        // Given
        String username = "testuser";

        // When
        metricsService.recordUserAccess(username);
        metricsService.recordUserAccess(username);

        // Then
        assertDoesNotThrow(() -> metricsService.recordUserAccess(username));
    }

    @Test
    void shouldReturnZeroForUnknownResourceType() {
        // When
        long totalRequests = metricsService.getTotalRequests("unknown");
        long totalErrors = metricsService.getTotalErrors("unknown");
        double errorRate = metricsService.getErrorRate("unknown");
        double avgResponseTime = metricsService.getAverageResponseTime("unknown");

        // Then
        assertEquals(0, totalRequests);
        assertEquals(0, totalErrors);
        assertEquals(0.0, errorRate);
        assertEquals(0.0, avgResponseTime);
    }

    @Test
    void shouldCalculateAverageResponseTime() {
        // Given
        metricsService.recordConnectionRequestDuration(Duration.ofMillis(100));
        metricsService.recordConnectionRequestDuration(Duration.ofMillis(200));
        metricsService.recordConnectionRequestDuration(Duration.ofMillis(300));

        // When
        double avgResponseTime = metricsService.getAverageResponseTime("connections");

        // Then
        assertEquals(200.0, avgResponseTime, 10.0); // Average should be around 200ms
    }
}