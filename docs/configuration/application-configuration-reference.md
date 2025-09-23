# Application Configuration Reference

## Overview

This document provides a comprehensive reference for all configuration options available in the RabbitMQ Admin application, including the new resource management features introduced in the latest version.

## Configuration Structure

The application configuration is organized into several main sections:

- **Core Application**: Basic Spring Boot and database configuration
- **Security**: Authentication, authorization, and security settings
- **Resource Management**: RabbitMQ resource browsing and management features
- **Monitoring**: Health checks, metrics, and performance monitoring
- **Logging**: Application and audit logging configuration

## Core Application Configuration

### Database Configuration

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rabbitmq_admin
    username: rabbitmq_admin
    password: ${DATABASE_PASSWORD:password}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

### JWT Configuration

```yaml
app:
  jwt:
    secret-key: ${JWT_SECRET_KEY:default-secret-key-change-in-production}
    expiration-time: 86400000 # 24 hours in milliseconds
```

### Server Configuration

```yaml
server:
  port: ${SERVER_PORT:8080}
  servlet:
    context-path: /
  compression:
    enabled: true
    mime-types: text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json
    min-response-size: 1024
```

### Web MVC Configuration

The application includes enhanced web configuration for proper URL path handling:

**URL Path Handling:**

- **Encoded Slash Support**: Automatic handling of encoded slashes in URL paths (critical for RabbitMQ vhost names)
- **Special Character Support**: Proper processing of special characters in path variables
- **Tomcat Connector Customization**: Enhanced connector settings for relaxed path and query character handling

**Configuration Details:**

The `WebConfig` class automatically configures:

```java
@Override
public void configurePathMatch(@NonNull PathMatchConfigurer configurer) {
    UrlPathHelper urlPathHelper = new UrlPathHelper();
    // Allow encoded slashes in path variables (needed for vhost names like "/")
    urlPathHelper.setUrlDecode(false);
    configurer.setUrlPathHelper(urlPathHelper);
}
```

This configuration is particularly important for:

- **RabbitMQ vhost names**: Proper handling of "/" (default vhost) and custom vhost names
- **API endpoints**: Correct processing of encoded path parameters
- **Multi-tenant environments**: Support for vhost names with special characters

## RabbitMQ Resource Management Configuration

The RabbitMQ resource management features are configured using the `RabbitMQResourceProperties` class with the prefix `rabbitmq.admin.resources`. This provides type-safe configuration with proper Spring Boot integration and validation.

### Configuration Properties Class Structure

```java
@Component
@ConfigurationProperties(prefix = "rabbitmq.admin.resources")
public class RabbitMQResourceProperties {
    private Refresh refresh = new Refresh();
    private Pagination pagination = new Pagination();
    private Cache cache = new Cache();
    private RateLimit rateLimit = new RateLimit();
    private ConnectionPool connectionPool = new ConnectionPool();
    private ThreadPool threadPool = new ThreadPool();
    private Security security = new Security();
    private Audit audit = new Audit();
    private DataProtection dataProtection = new DataProtection();
    private Health health = new Health();
    private Metrics metrics = new Metrics();
    private Logging logging = new Logging();
}
```

### Auto-Refresh Configuration

Controls automatic refresh behavior for resource pages using the `Refresh` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      refresh:
        # Default refresh interval for auto-refresh (milliseconds)
        default-interval: ${RABBITMQ_ADMIN_RESOURCES_REFRESH_DEFAULT_INTERVAL:30000}

        # Minimum allowed refresh interval (milliseconds)
        min-interval: ${RABBITMQ_ADMIN_RESOURCES_REFRESH_MIN_INTERVAL:15000}

        # Maximum allowed refresh interval (milliseconds)
        max-interval: ${RABBITMQ_ADMIN_RESOURCES_REFRESH_MAX_INTERVAL:300000}
```

**Environment Variables:**

- `RABBITMQ_ADMIN_RESOURCES_REFRESH_DEFAULT_INTERVAL`: Default refresh interval (default: 30000ms)
- `RABBITMQ_ADMIN_RESOURCES_REFRESH_MIN_INTERVAL`: Minimum refresh interval (default: 15000ms)
- `RABBITMQ_ADMIN_RESOURCES_REFRESH_MAX_INTERVAL`: Maximum refresh interval (default: 300000ms)

### Pagination Configuration

Controls pagination behavior for resource lists using the `Pagination` nested class with `ResourcePagination` for resource-specific settings:

```yaml
rabbitmq:
  admin:
    resources:
      pagination:
        # Global pagination defaults
        default-page-size: ${RABBITMQ_ADMIN_RESOURCES_PAGINATION_DEFAULT_PAGE_SIZE:50}
        max-page-size: ${RABBITMQ_ADMIN_RESOURCES_PAGINATION_MAX_PAGE_SIZE:500}
        min-page-size: 10

        # Resource-specific pagination settings using ResourcePagination class
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

**Environment Variables:**

- `RABBITMQ_ADMIN_RESOURCES_PAGINATION_DEFAULT_PAGE_SIZE`: Default page size (default: 50)
- `RABBITMQ_ADMIN_RESOURCES_PAGINATION_MAX_PAGE_SIZE`: Maximum page size (default: 500)

### Cache Configuration

Controls client-side and server-side caching using the `Cache` nested class with `ResourceCache` for resource-specific settings:

```yaml
rabbitmq:
  admin:
    resources:
      cache:
        # Enable/disable caching globally
        enabled: ${RABBITMQ_ADMIN_RESOURCES_CACHE_ENABLED:true}

        # Default cache TTL (time-to-live) in milliseconds
        default-ttl: ${RABBITMQ_ADMIN_RESOURCES_CACHE_DEFAULT_TTL:30000}

        # Maximum number of cache entries
        max-size: ${RABBITMQ_ADMIN_RESOURCES_CACHE_MAX_SIZE:1000}

        # Cache cleanup interval in milliseconds
        cleanup-interval: 60000

        # Resource-specific cache settings using ResourceCache class
        connections:
          ttl: 30000 # 30 seconds (highly dynamic)
          max-size: 200
        channels:
          ttl: 30000 # 30 seconds (highly dynamic)
          max-size: 500
        exchanges:
          ttl: 300000 # 5 minutes (less dynamic)
          max-size: 100
        queues:
          ttl: 60000 # 1 minute (moderately dynamic)
          max-size: 300
```

**Environment Variables:**

- `RABBITMQ_ADMIN_RESOURCES_CACHE_ENABLED`: Enable caching (default: true)
- `RABBITMQ_ADMIN_RESOURCES_CACHE_DEFAULT_TTL`: Default cache TTL (default: 30000ms)
- `RABBITMQ_ADMIN_RESOURCES_CACHE_MAX_SIZE`: Maximum cache entries (default: 1000)

### Rate Limiting Configuration

Controls API request rate limiting using the `RateLimit` nested class with `RateLimitConfig` for different scopes:

```yaml
rabbitmq:
  admin:
    resources:
      rate-limit:
        # Global rate limits (across all users)
        global:
          requests-per-minute: 1000
          burst-size: 50

        # Per-user rate limits
        per-user:
          requests-per-minute: ${RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_REQUESTS_PER_MINUTE:120}
          burst-size: ${RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_BURST_SIZE:10}

        # Per-cluster rate limits
        per-cluster:
          requests-per-minute: 500
          burst-size: 25
```

**Environment Variables:**

- `RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_REQUESTS_PER_MINUTE`: Per-user requests per minute (default: 120)
- `RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_BURST_SIZE`: Per-user burst size (default: 10)

### Connection Pool Configuration

Controls HTTP connection pooling for RabbitMQ API calls using the `ConnectionPool` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      connection-pool:
        # Maximum total connections in the pool
        max-total: ${RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_TOTAL:20}

        # Maximum connections per route (per RabbitMQ cluster)
        max-per-route: ${RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_PER_ROUTE:10}

        # Connection timeout in milliseconds
        connection-timeout: ${RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_CONNECTION_TIMEOUT:10000}

        # Socket timeout in milliseconds
        socket-timeout: ${RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_SOCKET_TIMEOUT:30000}

        # Connection request timeout in milliseconds
        connection-request-timeout: 5000
```

**Environment Variables:**

- `RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_TOTAL`: Maximum total connections (default: 20)
- `RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_PER_ROUTE`: Maximum per route (default: 10)
- `RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_CONNECTION_TIMEOUT`: Connection timeout (default: 10000ms)
- `RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_SOCKET_TIMEOUT`: Socket timeout (default: 30000ms)

### Thread Pool Configuration

Controls async operation thread pool using the `ThreadPool` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      thread-pool:
        # Core thread pool size
        core-size: 5

        # Maximum thread pool size
        max-size: 20

        # Queue capacity for pending tasks
        queue-capacity: 100

        # Keep alive time for idle threads (milliseconds)
        keep-alive: 60000
```

## Security Configuration

### Resource Access Security

Controls access to resource management features using the `Security` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      security:
        # Minimum role required for resource access
        min-role: USER

        # Resource-specific permissions
        permissions:
          connections:
            roles: [USER, ADMIN]
            clusters: all # 'all' or 'assigned'
          channels:
            roles: [USER, ADMIN]
            clusters: all
          exchanges:
            roles: [USER, ADMIN]
            clusters: assigned # Users can only access assigned clusters
          queues:
            roles: [USER, ADMIN]
            clusters: assigned
```

### Audit Configuration

Controls audit logging for resource access using the `Audit` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      audit:
        # Enable/disable audit logging
        enabled: true

        # Audit log level
        log-level: INFO

        # Include request/response bodies in audit logs
        include-request-body: false
        include-response-body: false

        # Events to audit
        events:
          - resource-access
          - authentication-failure
          - authorization-failure
          - rate-limit-exceeded
```

### Data Protection Configuration

Controls sensitive data filtering and masking using the `DataProtection` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      data-protection:
        # Filter sensitive connection properties
        filter-sensitive-properties: true

        # Note: Sensitive patterns are defined in the DataProtection class
        # Default patterns include: password, secret, key, token, credential

        # Mask sensitive values in responses
        mask-sensitive-values: true
        mask-character: "*"
```

## Monitoring Configuration

### Health Check Configuration

Controls application health monitoring using the `Health` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      health:
        # Enable/disable health checks
        enabled: true

        # Health check interval in milliseconds
        check-interval: 30000
```

### Metrics Configuration

Controls metrics collection and export using the `Metrics` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      metrics:
        # Enable/disable metrics collection
        enabled: true
```

## Logging Configuration

### Application Logging

Controls general application logging:

```yaml
logging:
  level:
    root: INFO
    com.rabbitmq.admin: INFO
    com.rabbitmq.admin.service.RabbitMQResourceService: INFO
    com.rabbitmq.admin.controller.RabbitMQResourceController: INFO
    com.rabbitmq.admin.aspect.PerformanceMonitoringAspect: INFO

  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

  file:
    name: logs/application.log
    max-size: 100MB
    max-history: 30
```

### Resource Management Logging

Controls resource-specific logging using the `Logging` nested class:

```yaml
rabbitmq:
  admin:
    resources:
      logging:
        # Log HTTP requests/responses (debug only)
        log-requests: false
        log-responses: false

        # Performance logging
        log-slow-requests: true
        slow-request-threshold: 5000 # milliseconds

        # Error logging
        log-errors: true
        include-stack-traces: true
```

## Performance Monitoring Configuration

### Performance Thresholds

Controls performance monitoring and alerting:

```yaml
app:
  monitoring:
    performance:
      # Slow operation threshold (milliseconds)
      slow-threshold-ms: 2000

      # Critical operation threshold (milliseconds)
      critical-threshold-ms: 5000

    health:
      # Health check interval in minutes
      check-interval-minutes: 2

      # Health check timeout in seconds
      timeout-seconds: 10
```

**Environment Variables:**

- `APP_MONITORING_PERFORMANCE_SLOW_THRESHOLD_MS`: Slow operation threshold (default: 2000ms)
- `APP_MONITORING_PERFORMANCE_CRITICAL_THRESHOLD_MS`: Critical operation threshold (default: 5000ms)
- `APP_MONITORING_HEALTH_CHECK_INTERVAL_MINUTES`: Health check interval (default: 2 minutes)
- `APP_MONITORING_HEALTH_TIMEOUT_SECONDS`: Health check timeout (default: 10 seconds)

## Environment-Specific Configurations

### Development Environment

```yaml
# Development-specific overrides
rabbitmq:
  admin:
    resources:
      # More verbose logging for development
      logging:
        log-requests: true
        log-responses: true
        log-slow-requests: true
        slow-request-threshold: 1000

      # Shorter cache TTL for testing
      cache:
        default-ttl: 10000
        connections:
          ttl: 5000
        channels:
          ttl: 5000

      # More frequent health checks
      health:
        check-interval: 10000

      # Relaxed rate limits for development
      rate-limit:
        per-user:
          requests-per-minute: 1000
          burst-size: 50

# Development logging
logging:
  level:
    com.rabbitmq.admin: DEBUG
    org.springframework.web: DEBUG
```

### Production Environment

```yaml
# Production-specific overrides
rabbitmq:
  admin:
    resources:
      # Minimal logging for production
      logging:
        log-requests: false
        log-responses: false
        log-slow-requests: true
        slow-request-threshold: 5000

      # Optimized cache settings
      cache:
        default-ttl: 60000
        max-size: 2000
        connections:
          ttl: 30000
          max-size: 500
        channels:
          ttl: 30000
          max-size: 1000
        exchanges:
          ttl: 600000
          max-size: 200
        queues:
          ttl: 120000
          max-size: 500

      # Standard health checks
      health:
        check-interval: 60000

      # Strict rate limits for production
      rate-limit:
        per-user:
          requests-per-minute: 60
          burst-size: 5
        per-cluster:
          requests-per-minute: 300
          burst-size: 15

      # Optimized connection pool
      connection-pool:
        max-total: 50
        max-per-route: 20
        connection-timeout: 15000
        socket-timeout: 45000

# Production logging
logging:
  level:
    root: WARN
    com.rabbitmq.admin: INFO
  file:
    name: /var/log/rabbitmq-admin/application.log
    max-size: 500MB
    max-history: 60
```

### Testing Environment

```yaml
# Testing-specific overrides
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

      # Relaxed timeouts for testing
      connection-pool:
        connection-timeout: 30000
        socket-timeout: 60000

      # Minimal rate limiting for tests
      rate-limit:
        per-user:
          requests-per-minute: 10000
          burst-size: 100

# Test logging
logging:
  level:
    com.rabbitmq.admin: DEBUG
    org.springframework.test: DEBUG
```

## Configuration Validation

### Required Configuration

The following configuration values are required for the application to start:

1. **Database Connection**: `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`
2. **JWT Secret**: `app.jwt.secret-key` (must be changed from default in production)

### Optional Configuration

All resource management configuration is optional and will use sensible defaults if not specified.

### Configuration Validation Commands

```bash
# Validate configuration syntax
java -jar rabbitmq-admin.jar --validate-config

# Check configuration properties
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/configprops" | jq '.rabbitmq'

# View environment-specific configuration
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/env" | jq '.propertySources'
```

## Best Practices

### Configuration Management

1. **Use Environment Variables**: Override sensitive values using environment variables
2. **Profile-Specific Configuration**: Use Spring profiles for environment-specific settings
3. **Secure Secrets**: Never commit sensitive values to version control
4. **Document Changes**: Document all configuration changes and their impact
5. **Test Configuration**: Test configuration changes in non-production environments first

### Performance Optimization

1. **Start Conservative**: Begin with conservative settings and optimize based on usage
2. **Monitor Impact**: Track the impact of configuration changes on performance
3. **Cache Tuning**: Adjust cache TTL and size based on data volatility and memory constraints
4. **Rate Limiting**: Set appropriate rate limits to prevent abuse while allowing normal usage
5. **Connection Pooling**: Optimize connection pool settings based on cluster count and load

### Security Considerations

1. **Principle of Least Privilege**: Configure minimum required permissions
2. **Audit Everything**: Enable comprehensive audit logging for compliance
3. **Data Protection**: Enable sensitive data filtering and masking
4. **Rate Limiting**: Implement appropriate rate limits to prevent abuse
5. **Regular Updates**: Keep configuration updated with security best practices

This configuration reference provides comprehensive documentation for all available configuration options in the RabbitMQ Admin application. Use this as a guide for customizing the application to meet your specific requirements and environment constraints.
