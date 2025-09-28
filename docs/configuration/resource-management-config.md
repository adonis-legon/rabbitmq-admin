# Resource Management Configuration Guide

## Overview

This guide covers configuration options for the RabbitMQ Resource Management features, including auto-refresh settings, pagination preferences, caching behavior, and performance tuning. The resource management system supports both read operations (viewing resources) and write operations (creating, modifying, and deleting resources). Write operations are currently implemented in the backend for exchanges, queues, binding creation, and message publishing, with frontend UI components partially implemented (exchange creation dialog available, additional dialogs planned for future implementation). Note that binding deletion is not currently supported via API.

## Auto-Refresh Configuration

### Frontend Auto-Refresh Settings

Auto-refresh can be configured independently for each resource type through the user interface.

#### Available Intervals

| Interval    | Use Case                                    | Resource Impact   |
| ----------- | ------------------------------------------- | ----------------- |
| 15 seconds  | High-frequency monitoring, critical systems | High API load     |
| 30 seconds  | Standard monitoring, active development     | Moderate API load |
| 1 minute    | Regular monitoring, stable environments     | Low API load      |
| 5 minutes   | Periodic checks, background monitoring      | Minimal API load  |
| Manual only | On-demand updates, troubleshooting          | No automatic load |

#### Configuration Steps

1. **Per-Resource Configuration:**

   - Navigate to any resource page (Connections, Channels, Exchanges, Queues)
   - Locate the refresh controls in the top-right corner
   - Toggle auto-refresh on/off using the switch
   - Select desired interval from the dropdown

2. **Settings Persistence:**

   - Auto-refresh settings are saved per resource type
   - Settings persist across browser sessions
   - Each resource type maintains independent settings
   - Settings are stored in browser local storage

3. **Global Override:**

   ```javascript
   // Disable auto-refresh globally (browser console)
   localStorage.setItem("autoRefreshDisabled", "true");

   // Set default interval for all resources
   localStorage.setItem("defaultRefreshInterval", "60000"); // 1 minute in ms

   // Reload page to apply changes
   location.reload();
   ```

#### Best Practices

**High-Frequency Environments:**

- Use 15-30 second intervals for active development
- Monitor during deployments or troubleshooting
- Consider impact on cluster performance

**Stable Environments:**

- Use 1-5 minute intervals for production monitoring
- Reduce unnecessary API load
- Focus on trend monitoring rather than real-time updates

**Resource-Specific Recommendations:**

- **Connections**: 30 seconds (moderate volatility)
- **Channels**: 30 seconds (high volatility)
- **Exchanges**: 5 minutes (low volatility)
- **Queues**: 1 minute (moderate volatility)

### Backend Configuration

#### Application Properties

Configure auto-refresh behavior in `application.yml` using the `RabbitMQResourceProperties` class:

```yaml
rabbitmq:
  admin:
    resources:
      # Auto-refresh configuration using Refresh nested class
      refresh:
        default-interval: 30000 # Default refresh interval in milliseconds
        min-interval: 15000 # Minimum allowed refresh interval
        max-interval: 300000 # Maximum allowed refresh interval

      # Pagination configuration using Pagination nested class
      pagination:
        default-page-size: 50 # Default items per page
        max-page-size: 500 # Maximum items per page
        min-page-size: 10 # Minimum items per page

        # Resource-specific defaults using ResourcePagination nested class
        connections:
          default-page-size: 25
          max-page-size: 200
        channels:
          default-page-size: 50
          max-page-size: 300
        exchanges:
          default-page-size: 100
          max-page-size: 500
        queues:
          default-page-size: 50
          max-page-size: 300

      # Cache configuration using Cache nested class
      cache:
        enabled: true # Enable/disable caching
        default-ttl: 30000 # Default cache TTL in milliseconds
        max-size: 1000 # Maximum cache entries
        cleanup-interval: 60000 # Cache cleanup interval

        # Resource-specific cache settings using ResourceCache nested class
        connections:
          ttl: 30000
          max-size: 200
        channels:
          ttl: 30000
          max-size: 500
        exchanges:
          ttl: 300000
          max-size: 100
        queues:
          ttl: 60000
          max-size: 300

      # Rate limiting configuration using RateLimit nested class
      rate-limit:
        # Global rate limits using RateLimitConfig nested class
        global:
          requests-per-minute: 1000
          burst-size: 50

        # Per-user rate limits using RateLimitConfig nested class
        per-user:
          requests-per-minute: 120
          burst-size: 10

        # Per-cluster rate limits using RateLimitConfig nested class
        per-cluster:
          requests-per-minute: 500
          burst-size: 25

      # Connection pool configuration using ConnectionPool nested class
      connection-pool:
        max-total: 20 # Maximum total connections
        max-per-route: 10 # Maximum connections per route
        connection-timeout: 10000 # Connection timeout in milliseconds
        socket-timeout: 30000 # Socket timeout in milliseconds
        connection-request-timeout: 5000 # Connection request timeout

      # Thread pool configuration using ThreadPool nested class
      thread-pool:
        core-size: 5 # Core thread pool size
        max-size: 20 # Maximum thread pool size
        queue-capacity: 100 # Queue capacity
        keep-alive: 60000 # Keep alive time in milliseconds

      # Security configuration using Security nested class
      security:
        min-role: USER # Minimum role required for resource access

      # Audit configuration using Audit nested class
      audit:
        enabled: true
        log-level: INFO
        include-request-body: false
        include-response-body: false

      # Data protection using DataProtection nested class
      data-protection:
        filter-sensitive-properties: true
        mask-sensitive-values: true
        mask-character: "*"

      # Health checks using Health nested class
      health:
        enabled: true
        check-interval: 30000

# Application-level monitoring configuration
app:
  monitoring:
    performance:
      # Performance monitoring thresholds
      slow-threshold-ms: 2000
      critical-threshold-ms: 5000

    health:
      # Cluster health check configuration
      check-interval-minutes: 2
      timeout-seconds: 10

      # Metrics collection
      metrics:
        enabled: true

        # Metrics to collect
        collect:
          - request-count
          - response-time
          - error-rate
          - cache-hit-rate
          - memory-usage

        # Export configuration
        export:
          prometheus:
            enabled: true
            path: /metrics
          jmx:
            enabled: true

      # Logging configuration using Logging nested class
      logging:
        log-requests: false
        log-responses: false
        log-slow-requests: true
        slow-request-threshold: 5000 # milliseconds
        log-errors: true
        include-stack-traces: true
```

#### Environment Variables

Override configuration using environment variables:

```bash
# Auto-refresh configuration
RABBITMQ_ADMIN_RESOURCES_REFRESH_DEFAULT_INTERVAL=30000
RABBITMQ_ADMIN_RESOURCES_REFRESH_MIN_INTERVAL=15000
RABBITMQ_ADMIN_RESOURCES_REFRESH_MAX_INTERVAL=300000

# Pagination configuration
RABBITMQ_ADMIN_RESOURCES_PAGINATION_DEFAULT_PAGE_SIZE=50
RABBITMQ_ADMIN_RESOURCES_PAGINATION_MAX_PAGE_SIZE=500

# Cache configuration
RABBITMQ_ADMIN_RESOURCES_CACHE_ENABLED=true
RABBITMQ_ADMIN_RESOURCES_CACHE_DEFAULT_TTL=30000
RABBITMQ_ADMIN_RESOURCES_CACHE_MAX_SIZE=1000

# Rate limiting configuration
RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_REQUESTS_PER_MINUTE=120
RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_BURST_SIZE=10

# Connection pool configuration
RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_TOTAL=20
RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_PER_ROUTE=10
RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_CONNECTION_TIMEOUT=10000
RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_SOCKET_TIMEOUT=30000
```

## Pagination Configuration

### Frontend Pagination Settings

#### Page Size Options

Default page size options can be customized:

```javascript
// Customize available page sizes (browser console)
localStorage.setItem("pageSizeOptions", JSON.stringify([10, 25, 50, 100, 200]));

// Set default page size
localStorage.setItem("defaultPageSize", "50");

// Reload page to apply changes
location.reload();
```

#### Pagination Behavior

**Default Settings:**

- Default page size: 50 items
- Available options: 25, 50, 100, 200 items
- Page size preference persists across sessions
- Independent settings per resource type

**Customization Options:**

```javascript
// Resource-specific page sizes
const pageSizeConfig = {
  connections: 25, // Fewer connections typically
  channels: 50, // Moderate number of channels
  exchanges: 100, // Many exchanges possible
  queues: 50, // Moderate number of queues
};

localStorage.setItem("resourcePageSizes", JSON.stringify(pageSizeConfig));
```

### Backend Pagination Configuration

#### Application Properties

```yaml
rabbitmq:
  admin:
    resources:
      pagination:
        default-page-size: 50
        max-page-size: 500
        min-page-size: 10

        # Resource-specific defaults
        connections:
          default-page-size: 25
          max-page-size: 200
        channels:
          default-page-size: 50
          max-page-size: 300
        exchanges:
          default-page-size: 100
          max-page-size: 500
        queues:
          default-page-size: 50
          max-page-size: 300
```

#### Performance Considerations

**Large Datasets:**

- Use smaller page sizes (25-50) for better performance
- Implement name filtering to reduce dataset size
- Consider virtual scrolling for very large lists

**Memory Usage:**

- Larger page sizes increase memory usage
- Monitor browser memory consumption
- Balance user experience with performance

## Caching Configuration

### Client-Side Cache Settings

#### Cache TTL Configuration

Different resource types have optimized cache durations:

```javascript
// Customize cache TTL values (milliseconds)
const cacheConfig = {
  connections: 30000, // 30 seconds (highly dynamic)
  channels: 30000, // 30 seconds (highly dynamic)
  exchanges: 300000, // 5 minutes (less dynamic)
  queues: 60000, // 1 minute (moderately dynamic)
  bindings: 600000, // 10 minutes (least dynamic)
};

localStorage.setItem("cacheConfig", JSON.stringify(cacheConfig));
```

#### Cache Size Limits

```javascript
// Configure cache size limits
const cacheSizeConfig = {
  maxSize: 100, // Maximum number of cached entries
  maxMemory: 50 * 1024 * 1024, // 50MB memory limit
  cleanupInterval: 60000, // Cleanup every minute
};

localStorage.setItem("cacheSizeConfig", JSON.stringify(cacheSizeConfig));
```

#### Cache Management

```javascript
// Clear all caches
if (window.resourceCache) {
  window.resourceCache.clearAll();
}

// Clear specific resource cache
if (window.resourceCache) {
  window.resourceCache.clearConnections();
  window.resourceCache.clearChannels();
  window.resourceCache.clearExchanges();
  window.resourceCache.clearQueues();
}

// Get cache statistics
if (window.resourceCache) {
  console.log("Cache stats:", window.resourceCache.getStats());
}
```

### Backend Cache Configuration

#### Application Properties

```yaml
rabbitmq:
  admin:
    resources:
      cache:
        # Enable/disable caching
        enabled: true

        # Default TTL for cached responses
        default-ttl: 30000

        # Maximum cache size
        max-size: 1000

        # Cache cleanup interval
        cleanup-interval: 60000

        # Resource-specific cache settings
        connections:
          ttl: 30000
          max-size: 200
        channels:
          ttl: 30000
          max-size: 500
        exchanges:
          ttl: 300000
          max-size: 100
        queues:
          ttl: 60000
          max-size: 300
```

## Performance Tuning

### Frontend Performance

#### Memory Optimization

```javascript
// Enable memory optimization
localStorage.setItem("memoryOptimization", "true");

// Configure garbage collection hints
localStorage.setItem(
  "gcHints",
  JSON.stringify({
    maxIdleTime: 300000, // 5 minutes
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    cleanupInterval: 60000, // 1 minute
  })
);
```

#### Network Optimization

```javascript
// Configure request batching
localStorage.setItem(
  "requestBatching",
  JSON.stringify({
    enabled: true,
    batchSize: 5,
    batchDelay: 100, // milliseconds
  })
);

// Configure connection pooling
localStorage.setItem(
  "connectionPooling",
  JSON.stringify({
    maxConnections: 10,
    keepAlive: true,
    timeout: 30000,
  })
);
```

### Backend Performance

#### Connection Pool Configuration

```yaml
rabbitmq:
  admin:
    resources:
      connection-pool:
        max-total: 20
        max-per-route: 10
        connection-timeout: 10000
        socket-timeout: 30000
        connection-request-timeout: 5000

      # Thread pool for async operations
      thread-pool:
        core-size: 5
        max-size: 20
        queue-capacity: 100
        keep-alive: 60000
```

#### Rate Limiting

```yaml
rabbitmq:
  admin:
    resources:
      rate-limit:
        # Global rate limits
        global:
          requests-per-minute: 1000
          burst-size: 50

        # Per-user rate limits
        per-user:
          requests-per-minute: 120
          burst-size: 10

        # Per-cluster rate limits
        per-cluster:
          requests-per-minute: 500
          burst-size: 25
```

## Security Configuration

### Access Control

#### Role-Based Configuration

```yaml
rabbitmq:
  admin:
    resources:
      security:
        # Minimum role required
        min-role: USER

        # Resource-specific permissions
        permissions:
          connections:
            roles: [USER, ADMIN]
            clusters: all
          channels:
            roles: [USER, ADMIN]
            clusters: all
          exchanges:
            roles: [USER, ADMIN]
            clusters: assigned
          queues:
            roles: [USER, ADMIN]
            clusters: assigned
```

#### Audit Configuration

```yaml
rabbitmq:
  admin:
    resources:
      audit:
        enabled: true
        log-level: INFO
        include-request-body: false
        include-response-body: false

        # Events to audit
        events:
          - resource-access
          - authentication-failure
          - authorization-failure
          - rate-limit-exceeded
```

### Data Protection

#### Sensitive Data Filtering

```yaml
rabbitmq:
  admin:
    resources:
      data-protection:
        # Filter sensitive connection properties
        filter-sensitive-properties: true

        # Sensitive property patterns
        sensitive-patterns:
          - "password"
          - "secret"
          - "key"
          - "token"
          - "credential"

        # Mask sensitive values
        mask-sensitive-values: true
        mask-character: "*"
```

## Monitoring Configuration

### Metrics Collection

#### Application Metrics

```yaml
rabbitmq:
  admin:
    resources:
      metrics:
        enabled: true

        # Metrics to collect
        collect:
          - request-count
          - response-time
          - error-rate
          - cache-hit-rate
          - memory-usage

        # Export configuration
        export:
          prometheus:
            enabled: true
            path: /metrics
          jmx:
            enabled: true
```

#### Health Checks

```yaml
rabbitmq:
  admin:
    resources:
      health:
        enabled: true

        # Health check intervals
        check-interval: 30000

        # Health indicators
        indicators:
          - cluster-connectivity
          - api-availability
          - cache-health
          - memory-usage
```

### Logging Configuration

#### Application Logging

```yaml
logging:
  level:
    com.rabbitmq.admin.service.RabbitMQResourceService: INFO
    com.rabbitmq.admin.controller.RabbitMQResourceController: INFO

  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

rabbitmq:
  admin:
    resources:
      logging:
        # Request/response logging
        log-requests: false
        log-responses: false

        # Performance logging
        log-slow-requests: true
        slow-request-threshold: 5000 # milliseconds

        # Error logging
        log-errors: true
        include-stack-traces: true
```

## Environment-Specific Configuration

### Development Environment

```yaml
rabbitmq:
  admin:
    resources:
      # More verbose logging
      logging:
        log-requests: true
        log-responses: true

      # Shorter cache TTL for testing
      cache:
        default-ttl: 10000

      # More frequent health checks
      health:
        check-interval: 10000

      # Relaxed rate limits
      rate-limit:
        requests-per-minute: 1000
```

### Production Environment

```yaml
rabbitmq:
  admin:
    resources:
      # Minimal logging
      logging:
        log-requests: false
        log-responses: false
        log-slow-requests: true

      # Optimized cache settings
      cache:
        default-ttl: 60000
        max-size: 2000

      # Standard health checks
      health:
        check-interval: 60000

      # Strict rate limits
      rate-limit:
        requests-per-minute: 500
        per-user:
          requests-per-minute: 60
```

### Testing Environment

```yaml
rabbitmq:
  admin:
    resources:
      # Disable caching for consistent tests
      cache:
        enabled: false

      # Fast refresh for testing
      refresh:
        default-interval: 5000
        min-interval: 1000

      # Relaxed timeouts
      connection-pool:
        connection-timeout: 30000
        socket-timeout: 60000
```

## Troubleshooting Configuration Issues

### Common Configuration Problems

#### Cache Not Working

```yaml
# Ensure cache is enabled
rabbitmq:
  admin:
    resources:
      cache:
        enabled: true # Must be true
        default-ttl: 30000 # Must be > 0
```

#### Auto-Refresh Not Working

```javascript
// Check browser settings
console.log(
  "Auto-refresh disabled:",
  localStorage.getItem("autoRefreshDisabled")
);
console.log(
  "Default interval:",
  localStorage.getItem("defaultRefreshInterval")
);

// Clear problematic settings
localStorage.removeItem("autoRefreshDisabled");
localStorage.removeItem("defaultRefreshInterval");
```

#### Performance Issues

```yaml
# Optimize for performance
rabbitmq:
  admin:
    resources:
      pagination:
        default-page-size: 25 # Smaller pages
      cache:
        default-ttl: 60000 # Longer cache
      rate-limit:
        requests-per-minute: 300 # Lower limits
```

### Configuration Validation

#### Validate Settings

```bash
# Check configuration syntax
java -jar rabbitmq-admin.jar --validate-config

# Test configuration
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/configprops" | jq '.rabbitmq'
```

#### Monitor Configuration

```javascript
// Monitor frontend configuration
console.log(
  "Page size options:",
  JSON.parse(localStorage.getItem("pageSizeOptions") || "[]")
);
console.log(
  "Cache config:",
  JSON.parse(localStorage.getItem("cacheConfig") || "{}")
);
console.log("Auto-refresh settings:", {
  connections: localStorage.getItem("autoRefresh-connections"),
  channels: localStorage.getItem("autoRefresh-channels"),
  exchanges: localStorage.getItem("autoRefresh-exchanges"),
  queues: localStorage.getItem("autoRefresh-queues"),
});
```

## Best Practices

### Configuration Management

1. **Version Control**: Store configuration files in version control
2. **Environment Separation**: Use different configs for dev/test/prod
3. **Documentation**: Document all configuration changes
4. **Testing**: Test configuration changes in non-production environments
5. **Monitoring**: Monitor the impact of configuration changes

### Performance Optimization

1. **Start Conservative**: Begin with conservative settings and optimize based on usage
2. **Monitor Impact**: Track the impact of configuration changes on performance
3. **User Feedback**: Gather feedback from users about performance and usability
4. **Regular Review**: Regularly review and update configuration based on usage patterns
5. **Capacity Planning**: Plan configuration based on expected load and growth

### Security Considerations

1. **Principle of Least Privilege**: Configure minimum required permissions
2. **Audit Trail**: Enable comprehensive audit logging
3. **Data Protection**: Configure appropriate data filtering and masking
4. **Rate Limiting**: Implement appropriate rate limits to prevent abuse
5. **Regular Updates**: Keep configuration updated with security best practices
