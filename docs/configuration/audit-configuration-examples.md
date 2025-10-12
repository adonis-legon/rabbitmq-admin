# Audit Configuration Examples

This document provides practical configuration examples for different deployment scenarios and environments.

## Quick Start Configurations

### Minimal Configuration (Development)

```yaml
# application-dev.yml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 7
      batch-size: 10
      async-processing: false
```

**Use Case**: Local development and testing
**Benefits**:

- Easy debugging with synchronous processing
- Short retention saves storage
- Small batches for detailed monitoring

### Standard Configuration (Production)

```yaml
# application-prod.yml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 90
      batch-size: 500
      async-processing: true
```

**Use Case**: Standard production deployment
**Benefits**:

- Balanced performance and storage
- Asynchronous processing for better performance
- 3-month retention for most business needs

### High-Performance Configuration (Production with Retention)

```yaml
# application-prod.yml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 90
      batch-size: 500
      async-processing: true
    retention:
      enabled: true
      days: 90
      clean-schedule: "0 0 2 * * ?" # 2 AM cleanup
```

**Use Case**: Production with automatic cleanup
**Benefits**:

- Automatic cleanup prevents database growth
- Off-peak cleanup time (2 AM)
- Maintains audit data for 90 days
- High-performance batch processing

## Environment-Specific Examples

### Development Environment

```yaml
# application-development.yml
spring:
  profiles:
    active: development

app:
  audit:
    write-operations:
      enabled: ${AUDIT_ENABLED:true}
      retention-days: ${AUDIT_RETENTION_DAYS:7}
      batch-size: ${AUDIT_BATCH_SIZE:10}
      async-processing: ${AUDIT_ASYNC_PROCESSING:false}

# Enable debug logging for audit system
logging:
  level:
    com.rabbitmq.admin.service.WriteAuditService: DEBUG
    com.rabbitmq.admin.aspect.WriteOperationAuditAspect: DEBUG
```

**Environment Variables**:

```bash
export AUDIT_ENABLED=true
export AUDIT_RETENTION_DAYS=7
export AUDIT_BATCH_SIZE=10
export AUDIT_ASYNC_PROCESSING=false
```

### Testing Environment

```yaml
# application-test.yml
spring:
  profiles:
    active: test

app:
  audit:
    write-operations:
      enabled: true
      retention-days: 1  # Very short for test cleanup
      batch-size: 5      # Small for test verification
      async-processing: false  # Synchronous for test assertions

# Test-specific database configuration
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

### Staging Environment

```yaml
# application-staging.yml
spring:
  profiles:
    active: staging

app:
  audit:
    write-operations:
      enabled: ${AUDIT_ENABLED:true}
      retention-days: ${AUDIT_RETENTION_DAYS:30}
      batch-size: ${AUDIT_BATCH_SIZE:50}
      async-processing: ${AUDIT_ASYNC_PROCESSING:true}

# Staging-specific monitoring
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,refresh,audit
```

### Production Environment

```yaml
# application-production.yml
spring:
  profiles:
    active: production

app:
  audit:
    write-operations:
      enabled: ${AUDIT_ENABLED:true}
      retention-days: ${AUDIT_RETENTION_DAYS:90}
      batch-size: ${AUDIT_BATCH_SIZE:500}
      async-processing: ${AUDIT_ASYNC_PROCESSING:true}

# Production logging configuration
logging:
  level:
    com.rabbitmq.admin.service.WriteAuditService: INFO
    AUDIT: INFO
  pattern:
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

## Specialized Configurations

### High-Volume Environment

```yaml
# High-throughput configuration
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 60
      batch-size: 1000 # Large batches for performance
      async-processing: true

# Additional thread pool configuration
spring:
  task:
    execution:
      pool:
        core-size: 10
        max-size: 50
        queue-capacity: 1000
```

**Environment Variables**:

```bash
export AUDIT_ENABLED=true
export AUDIT_RETENTION_DAYS=60
export AUDIT_BATCH_SIZE=1000
export AUDIT_ASYNC_PROCESSING=true
```

### Compliance Environment (Financial Services)

```yaml
# Strict compliance configuration
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 2555 # 7 years for financial compliance
      batch-size: 100 # Moderate batch for stability
      async-processing: true

# Enhanced security logging
logging:
  level:
    AUDIT: INFO
    SECURITY: DEBUG
```

### Low-Resource Environment

```yaml
# Resource-constrained configuration
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 30
      batch-size: 25 # Small batches to reduce memory usage
      async-processing: true

# Reduced thread pool
spring:
  task:
    execution:
      pool:
        core-size: 2
        max-size: 5
        queue-capacity: 100
```

### Disaster Recovery Environment

```yaml
# DR site configuration
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 90
      batch-size: 200
      async-processing: true

# DR-specific database configuration
spring:
  datasource:
    url: ${DR_DATABASE_URL}
    username: ${DR_DATABASE_USERNAME}
    password: ${DR_DATABASE_PASSWORD}
```

## Container Deployment Examples

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  rabbitmq-admin:
    image: rabbitmq-admin:latest
    environment:
      - AUDIT_ENABLED=true
      - AUDIT_RETENTION_DAYS=90
      - AUDIT_BATCH_SIZE=500
      - AUDIT_ASYNC_PROCESSING=true
      - DB_USERNAME=audit_user
      - DB_PASSWORD=secure_password
    volumes:
      - ./config/application-docker.yml:/app/config/application.yml
```

### Kubernetes Deployment

```yaml
# kubernetes-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rabbitmq-admin
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rabbitmq-admin
  template:
    metadata:
      labels:
        app: rabbitmq-admin
    spec:
      containers:
        - name: rabbitmq-admin
          image: rabbitmq-admin:latest
          env:
            - name: AUDIT_ENABLED
              valueFrom:
                configMapKeyRef:
                  name: audit-config
                  key: enabled
            - name: AUDIT_RETENTION_DAYS
              valueFrom:
                configMapKeyRef:
                  name: audit-config
                  key: retention-days
            - name: AUDIT_BATCH_SIZE
              valueFrom:
                configMapKeyRef:
                  name: audit-config
                  key: batch-size
            - name: AUDIT_ASYNC_PROCESSING
              valueFrom:
                configMapKeyRef:
                  name: audit-config
                  key: async-processing
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: audit-config
data:
  enabled: "true"
  retention-days: "90"
  batch-size: "500"
  async-processing: "true"
```

### Helm Chart Values

```yaml
# values.yaml
audit:
  enabled: true
  retentionDays: 90
  batchSize: 500
  asyncProcessing: true

# Environment-specific overrides
environments:
  development:
    audit:
      retentionDays: 7
      batchSize: 10
      asyncProcessing: false

  production:
    audit:
      retentionDays: 365
      batchSize: 1000
      asyncProcessing: true
```

## Cloud Provider Examples

### AWS ECS Configuration

```json
{
  "family": "rabbitmq-admin",
  "taskDefinition": {
    "containerDefinitions": [
      {
        "name": "rabbitmq-admin",
        "image": "rabbitmq-admin:latest",
        "environment": [
          {
            "name": "AUDIT_ENABLED",
            "value": "true"
          },
          {
            "name": "AUDIT_RETENTION_DAYS",
            "value": "90"
          },
          {
            "name": "AUDIT_BATCH_SIZE",
            "value": "500"
          },
          {
            "name": "AUDIT_ASYNC_PROCESSING",
            "value": "true"
          }
        ]
      }
    ]
  }
}
```

### Azure Container Instances

```yaml
# azure-container-instance.yml
apiVersion: 2019-12-01
location: eastus
name: rabbitmq-admin
properties:
  containers:
    - name: rabbitmq-admin
      properties:
        image: rabbitmq-admin:latest
        environmentVariables:
          - name: AUDIT_ENABLED
            value: true
          - name: AUDIT_RETENTION_DAYS
            value: 90
          - name: AUDIT_BATCH_SIZE
            value: 500
          - name: AUDIT_ASYNC_PROCESSING
            value: true
```

### Google Cloud Run

```yaml
# cloudrun-service.yml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: rabbitmq-admin
spec:
  template:
    spec:
      containers:
        - image: gcr.io/project/rabbitmq-admin:latest
          env:
            - name: AUDIT_ENABLED
              value: "true"
            - name: AUDIT_RETENTION_DAYS
              value: "90"
            - name: AUDIT_BATCH_SIZE
              value: "500"
            - name: AUDIT_ASYNC_PROCESSING
              value: "true"
```

## Configuration Validation Examples

### Validation Script

```bash
#!/bin/bash
# validate-audit-config.sh

# Function to validate configuration
validate_config() {
    local enabled=$1
    local retention=$2
    local batch=$3
    local async=$4

    # Validate enabled flag
    if [[ "$enabled" != "true" && "$enabled" != "false" ]]; then
        echo "ERROR: enabled must be true or false, got: $enabled"
        return 1
    fi

    # Validate retention days
    if [[ ! "$retention" =~ ^[0-9]+$ ]] || [[ "$retention" -lt 1 ]] || [[ "$retention" -gt 36500 ]]; then
        echo "ERROR: retention-days must be between 1 and 36500, got: $retention"
        return 1
    fi

    # Validate batch size
    if [[ ! "$batch" =~ ^[0-9]+$ ]] || [[ "$batch" -lt 1 ]] || [[ "$batch" -gt 10000 ]]; then
        echo "ERROR: batch-size must be between 1 and 10000, got: $batch"
        return 1
    fi

    # Validate async processing
    if [[ "$async" != "true" && "$async" != "false" ]]; then
        echo "ERROR: async-processing must be true or false, got: $async"
        return 1
    fi

    echo "Configuration is valid"
    return 0
}

# Example usage
validate_config "true" "90" "500" "true"
```

### Configuration Test

```java
// ConfigurationValidationTest.java
@Test
void validateProductionConfiguration() {
    // Production configuration values
    System.setProperty("app.audit.write-operations.enabled", "true");
    System.setProperty("app.audit.write-operations.retention-days", "90");
    System.setProperty("app.audit.write-operations.batch-size", "500");
    System.setProperty("app.audit.write-operations.async-processing", "true");

    // Load and validate configuration
    AuditConfigurationProperties config = new AuditConfigurationProperties();
    config.setEnabled(true);
    config.setRetentionDays(90);
    config.setBatchSize(500);
    config.setAsyncProcessing(true);

    // Validate
    assertThat(config.isValid()).isTrue();
    assertThat(config.validateConfiguration()).isNull();
}
```

## Migration Examples

### Enabling Audit for Existing System

```yaml
# Step 1: Enable with minimal impact
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 30      # Start with short retention
      batch-size: 50          # Start with small batches
      async-processing: true  # Use async to minimize impact

# Step 2: Gradually increase after monitoring
# After 1 week, if performance is good:
app:
  audit:
    write-operations:
      retention-days: 90      # Increase retention
      batch-size: 200         # Increase batch size

# Step 3: Final production configuration
# After 1 month, optimize for production:
app:
  audit:
    write-operations:
      retention-days: 365     # Full retention
      batch-size: 500         # Optimal batch size
```

### Disabling Audit Temporarily

```yaml
# Temporary disable for maintenance
app:
  audit:
    write-operations:
      enabled: false # Disable audit
      # Keep other settings for easy re-enabling
      retention-days: 90
      batch-size: 500
      async-processing: true
```

## Troubleshooting Configurations

### Debug Configuration

```yaml
# Enhanced debugging configuration
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 7
      batch-size: 1 # Process one at a time for debugging
      async-processing: false # Synchronous for easier debugging

logging:
  level:
    com.rabbitmq.admin.service.WriteAuditService: TRACE
    com.rabbitmq.admin.aspect.WriteOperationAuditAspect: TRACE
    com.rabbitmq.admin.repository.AuditRepository: DEBUG
    org.springframework.transaction: DEBUG
```

### Performance Testing Configuration

```yaml
# Configuration for performance testing
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 1 # Minimal retention for testing
      batch-size: 1000 # Large batches for performance testing
      async-processing: true

# Enable performance metrics
management:
  metrics:
    export:
      prometheus:
        enabled: true
```

These examples provide a comprehensive guide for configuring the audit system in various scenarios. Choose the configuration that best matches your environment and requirements, and adjust as needed based on your specific use case.
