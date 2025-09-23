package com.rabbitmq.admin.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for collecting and managing metrics related to RabbitMQ resource
 * operations.
 * Provides performance metrics, error rate monitoring, and usage statistics.
 */
@Service
public class ResourceMetricsService {

    // Performance metrics
    private final Timer connectionRequestTimer;
    private final Timer channelRequestTimer;
    private final Timer exchangeRequestTimer;
    private final Timer queueRequestTimer;
    private final Timer bindingRequestTimer;

    // Error counters
    private final Counter connectionErrorCounter;
    private final Counter channelErrorCounter;
    private final Counter exchangeErrorCounter;
    private final Counter queueErrorCounter;
    private final Counter bindingErrorCounter;
    private final Counter clusterConnectivityErrorCounter;
    private final Counter authenticationErrorCounter;

    // Usage counters
    private final Counter totalResourceRequestsCounter;
    private final Counter uniqueClusterAccessCounter;
    private final Counter uniqueUserAccessCounter;

    // Cache for tracking unique accesses
    private final ConcurrentHashMap<UUID, AtomicLong> clusterAccessCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> userAccessCounts = new ConcurrentHashMap<>();

    public ResourceMetricsService(MeterRegistry meterRegistry) {

        // Initialize performance timers
        this.connectionRequestTimer = Timer.builder("rabbitmq.resource.request.duration")
                .description("Time taken to fetch connections")
                .tag("resource_type", "connections")
                .register(meterRegistry);

        this.channelRequestTimer = Timer.builder("rabbitmq.resource.request.duration")
                .description("Time taken to fetch channels")
                .tag("resource_type", "channels")
                .register(meterRegistry);

        this.exchangeRequestTimer = Timer.builder("rabbitmq.resource.request.duration")
                .description("Time taken to fetch exchanges")
                .tag("resource_type", "exchanges")
                .register(meterRegistry);

        this.queueRequestTimer = Timer.builder("rabbitmq.resource.request.duration")
                .description("Time taken to fetch queues")
                .tag("resource_type", "queues")
                .register(meterRegistry);

        this.bindingRequestTimer = Timer.builder("rabbitmq.resource.request.duration")
                .description("Time taken to fetch bindings")
                .tag("resource_type", "bindings")
                .register(meterRegistry);

        // Initialize error counters
        this.connectionErrorCounter = Counter.builder("rabbitmq.resource.errors")
                .description("Number of connection request errors")
                .tag("resource_type", "connections")
                .register(meterRegistry);

        this.channelErrorCounter = Counter.builder("rabbitmq.resource.errors")
                .description("Number of channel request errors")
                .tag("resource_type", "channels")
                .register(meterRegistry);

        this.exchangeErrorCounter = Counter.builder("rabbitmq.resource.errors")
                .description("Number of exchange request errors")
                .tag("resource_type", "exchanges")
                .register(meterRegistry);

        this.queueErrorCounter = Counter.builder("rabbitmq.resource.errors")
                .description("Number of queue request errors")
                .tag("resource_type", "queues")
                .register(meterRegistry);

        this.bindingErrorCounter = Counter.builder("rabbitmq.resource.errors")
                .description("Number of binding request errors")
                .tag("resource_type", "bindings")
                .register(meterRegistry);

        this.clusterConnectivityErrorCounter = Counter.builder("rabbitmq.cluster.connectivity.errors")
                .description("Number of cluster connectivity errors")
                .register(meterRegistry);

        this.authenticationErrorCounter = Counter.builder("rabbitmq.resource.authentication.errors")
                .description("Number of authentication errors during resource access")
                .register(meterRegistry);

        // Initialize usage counters
        this.totalResourceRequestsCounter = Counter.builder("rabbitmq.resource.requests.total")
                .description("Total number of resource requests")
                .register(meterRegistry);

        this.uniqueClusterAccessCounter = Counter.builder("rabbitmq.cluster.access.unique")
                .description("Number of unique cluster accesses")
                .register(meterRegistry);

        this.uniqueUserAccessCounter = Counter.builder("rabbitmq.user.access.unique")
                .description("Number of unique user accesses")
                .register(meterRegistry);
    }

    /**
     * Records the duration of a connection request.
     */
    public void recordConnectionRequestDuration(Duration duration) {
        connectionRequestTimer.record(duration);
        totalResourceRequestsCounter.increment();
    }

    /**
     * Records the duration of a channel request.
     */
    public void recordChannelRequestDuration(Duration duration) {
        channelRequestTimer.record(duration);
        totalResourceRequestsCounter.increment();
    }

    /**
     * Records the duration of an exchange request.
     */
    public void recordExchangeRequestDuration(Duration duration) {
        exchangeRequestTimer.record(duration);
        totalResourceRequestsCounter.increment();
    }

    /**
     * Records the duration of a queue request.
     */
    public void recordQueueRequestDuration(Duration duration) {
        queueRequestTimer.record(duration);
        totalResourceRequestsCounter.increment();
    }

    /**
     * Records the duration of a binding request.
     */
    public void recordBindingRequestDuration(Duration duration) {
        bindingRequestTimer.record(duration);
        totalResourceRequestsCounter.increment();
    }

    /**
     * Records a connection request error.
     */
    public void recordConnectionError() {
        connectionErrorCounter.increment();
    }

    /**
     * Records a channel request error.
     */
    public void recordChannelError() {
        channelErrorCounter.increment();
    }

    /**
     * Records an exchange request error.
     */
    public void recordExchangeError() {
        exchangeErrorCounter.increment();
    }

    /**
     * Records a queue request error.
     */
    public void recordQueueError() {
        queueErrorCounter.increment();
    }

    /**
     * Records a binding request error.
     */
    public void recordBindingError() {
        bindingErrorCounter.increment();
    }

    /**
     * Records a cluster connectivity error.
     */
    public void recordClusterConnectivityError() {
        clusterConnectivityErrorCounter.increment();
    }

    /**
     * Records an authentication error during resource access.
     */
    public void recordAuthenticationError() {
        authenticationErrorCounter.increment();
    }

    /**
     * Records cluster access for usage tracking.
     */
    public void recordClusterAccess(UUID clusterId) {
        clusterAccessCounts.computeIfAbsent(clusterId, k -> {
            uniqueClusterAccessCounter.increment();
            return new AtomicLong(0);
        }).incrementAndGet();
    }

    /**
     * Records user access for usage tracking.
     */
    public void recordUserAccess(String username) {
        userAccessCounts.computeIfAbsent(username, k -> {
            uniqueUserAccessCounter.increment();
            return new AtomicLong(0);
        }).incrementAndGet();
    }

    /**
     * Gets the current error rate for a specific resource type.
     */
    public double getErrorRate(String resourceType) {
        Counter errorCounter = getErrorCounterForResourceType(resourceType);
        Timer requestTimer = getTimerForResourceType(resourceType);

        if (errorCounter != null && requestTimer != null) {
            double errorCount = errorCounter.count();
            double totalCount = requestTimer.count();

            if (totalCount > 0) {
                return errorCount / totalCount;
            }
        }

        return 0.0;
    }

    /**
     * Gets the average response time for a specific resource type.
     */
    public double getAverageResponseTime(String resourceType) {
        Timer timer = getTimerForResourceType(resourceType);
        if (timer != null) {
            return timer.mean(java.util.concurrent.TimeUnit.MILLISECONDS);
        }
        return 0.0;
    }

    /**
     * Gets the total number of requests for a specific resource type.
     */
    public long getTotalRequests(String resourceType) {
        Timer timer = getTimerForResourceType(resourceType);
        if (timer != null) {
            return timer.count();
        }
        return 0;
    }

    /**
     * Gets the total number of errors for a specific resource type.
     */
    public long getTotalErrors(String resourceType) {
        Counter counter = getErrorCounterForResourceType(resourceType);
        if (counter != null) {
            return (long) counter.count();
        }
        return 0;
    }

    private Counter getErrorCounterForResourceType(String resourceType) {
        return switch (resourceType.toLowerCase()) {
            case "connections" -> connectionErrorCounter;
            case "channels" -> channelErrorCounter;
            case "exchanges" -> exchangeErrorCounter;
            case "queues" -> queueErrorCounter;
            case "bindings" -> bindingErrorCounter;
            default -> null;
        };
    }

    private Timer getTimerForResourceType(String resourceType) {
        return switch (resourceType.toLowerCase()) {
            case "connections" -> connectionRequestTimer;
            case "channels" -> channelRequestTimer;
            case "exchanges" -> exchangeRequestTimer;
            case "queues" -> queueRequestTimer;
            case "bindings" -> bindingRequestTimer;
            default -> null;
        };
    }
}