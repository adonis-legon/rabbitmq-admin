# Audit Configuration Troubleshooting Guide

This document provides troubleshooting guidance for common audit configuration issues and their solutions.

## Common Configuration Issues

### 1. Audit Not Working

**Symptoms:**

- No audit records are being created
- Write operations are not being logged
- Audit tables are empty

**Possible Causes and Solutions:**

#### Configuration Not Enabled

```yaml
# Check if audit is enabled
app:
  audit:
    write-operations:
      enabled: false # ← Should be true
```

**Solution:**

```yaml
app:
  audit:
    write-operations:
      enabled: true
```

#### Database Connection Issues

**Check database connectivity:**

```bash
# Test database connection
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/health/db"
```

**Solution:**

- Verify database credentials
- Check network connectivity
- Ensure audit tables exist (run Flyway migrations)

#### Missing Dependencies

**Check if WriteAuditService bean is created:**

```bash
# Check application context
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/beans" | grep -i audit
```

**Solution:**

- Verify all required dependencies are in classpath
- Check for conditional bean creation issues

### 2. Configuration Validation Errors

**Symptoms:**

- Application fails to start
- Configuration validation error messages
- Bean creation failures

**Common Validation Errors:**

#### Null Values

```
Error: Audit enabled flag must not be null. Use true or false.
```

**Solution:**

```yaml
app:
  audit:
    write-operations:
      enabled: true # Must not be null
      async-processing: true # Must not be null
```

#### Invalid Ranges

```
Error: Retention days must be at least 1. Consider using 7 days for development or 90+ days for production.
```

**Solution:**

```yaml
app:
  audit:
    write-operations:
      retention-days: 90 # Must be between 1 and 36,500
      batch-size: 100 # Must be between 1 and 10,000
```

### 3. Performance Issues

**Symptoms:**

- Slow write operations
- High memory usage
- Database performance degradation

**Possible Causes and Solutions:**

#### Large Batch Sizes

```yaml
# Problematic configuration
app:
  audit:
    write-operations:
      batch-size: 10000 # Too large
```

**Solution:**

```yaml
app:
  audit:
    write-operations:
      batch-size: 500 # More reasonable size
      async-processing: true # Enable async processing
```

#### Synchronous Processing

```yaml
# Problematic configuration
app:
  audit:
    write-operations:
      async-processing: false # Blocks write operations
```

**Solution:**

```yaml
app:
  audit:
    write-operations:
      async-processing: true # Enable async processing
```

#### Long Retention Periods

```yaml
# Problematic configuration
app:
  audit:
    write-operations:
      retention-days: 3650 # 10 years - too long
```

**Solution:**

```yaml
app:
  audit:
    write-operations:
      retention-days: 365 # 1 year - more reasonable
```

### 4. Storage Issues

**Symptoms:**

- Disk space running out
- Database growing too large
- Slow query performance

**Solutions:**

#### Implement Data Archiving

```sql
-- Archive old audit records
CREATE TABLE audit_records_archive AS
SELECT * FROM audit_records
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete archived records
DELETE FROM audit_records
WHERE created_at < NOW() - INTERVAL '1 year';
```

#### Optimize Retention Settings

```yaml
app:
  audit:
    write-operations:
      retention-days: 90 # Reduce retention period
```

#### Database Partitioning

```sql
-- Create partitioned table (PostgreSQL example)
CREATE TABLE audit_records_partitioned (
    LIKE audit_records INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_records_2024_01 PARTITION OF audit_records_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 5. Environment Variable Issues

**Symptoms:**

- Configuration not loading from environment variables
- Default values being used instead of environment values
- Inconsistent configuration across environments

**Common Issues:**

#### Incorrect Variable Names

```bash
# Incorrect
export AUDIT_ENABLED=true

# Correct
export AUDIT_WRITE_OPERATIONS_ENABLED=true
```

#### Type Conversion Issues

```bash
# Incorrect (string instead of boolean)
export AUDIT_WRITE_OPERATIONS_ENABLED="yes"

# Correct
export AUDIT_WRITE_OPERATIONS_ENABLED=true
```

#### Missing Environment Variables

```bash
# Check if variables are set
env | grep AUDIT
```

**Solution:**

```bash
# Set all required variables
export AUDIT_WRITE_OPERATIONS_ENABLED=true
export AUDIT_RETENTION_DAYS=90
export AUDIT_BATCH_SIZE=100
export AUDIT_ASYNC_PROCESSING=true
```

### 6. Configuration Refresh Issues

**Symptoms:**

- Configuration changes not taking effect
- Need to restart application for changes
- Inconsistent behavior after configuration updates

**Solutions:**

#### Manual Configuration Refresh

```bash
# Refresh configuration using actuator
curl -X POST http://localhost:8080/actuator/refresh
```

#### Verify Refresh Endpoint is Enabled

```yaml
management:
  endpoints:
    web:
      exposure:
        include: refresh
  endpoint:
    refresh:
      enabled: true
```

#### Check Configuration Properties

```bash
# View current configuration
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/configprops" | jq '.auditConfigurationProperties'
```

## Diagnostic Commands

### Check Configuration Status

```bash
# View all configuration properties
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/configprops"

# View environment variables
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/env"

# Check application health
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/health"
```

### Check Audit System Status

```bash
# Check if audit service is running
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/beans" | grep -i audit

# View audit metrics (if available)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/actuator/metrics" | grep audit
```

### Database Diagnostics

```sql
-- Check audit table structure
\d audit_records

-- Check recent audit records
SELECT * FROM audit_records
ORDER BY created_at DESC
LIMIT 10;

-- Check audit record counts by date
SELECT DATE(created_at) as date, COUNT(*) as count
FROM audit_records
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Check database size
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%audit%';
```

## Debug Configuration

### Enable Debug Logging

```yaml
logging:
  level:
    com.rabbitmq.admin.config.AuditConfigurationProperties: DEBUG
    com.rabbitmq.admin.service.WriteAuditService: DEBUG
    com.rabbitmq.admin.aspect.WriteOperationAuditAspect: DEBUG
    org.springframework.boot.context.properties: DEBUG
```

### Test Configuration Programmatically

```java
@Test
void debugConfiguration() {
    AuditConfigurationProperties config = new AuditConfigurationProperties();
    config.setEnabled(true);
    config.setRetentionDays(90);
    config.setBatchSize(100);
    config.setAsyncProcessing(true);

    // Validate configuration
    String validationError = config.validateConfiguration();
    if (validationError != null) {
        System.out.println("Configuration error: " + validationError);
    } else {
        System.out.println("Configuration is valid");
        System.out.println(config.getConfigurationSummary());
    }
}
```

## Prevention Best Practices

### 1. Configuration Validation

- Always validate configuration in non-production environments first
- Use configuration validation tests
- Implement health checks for audit system

### 2. Monitoring

- Monitor audit record creation rates
- Set up alerts for configuration validation failures
- Track database growth and performance

### 3. Documentation

- Document all configuration changes
- Maintain environment-specific configuration documentation
- Keep troubleshooting runbooks updated

### 4. Testing

- Test configuration changes in staging environment
- Implement automated configuration validation tests
- Verify configuration refresh functionality

### 5. Backup and Recovery

- Backup configuration files
- Document rollback procedures
- Test configuration recovery processes

## Getting Help

### Log Analysis

When reporting issues, include:

- Application logs with DEBUG level enabled
- Configuration property values (sanitized)
- Environment variable settings
- Database connection status
- Recent configuration changes

### Support Information

Provide the following information when seeking support:

- Application version
- Environment details (dev/staging/production)
- Configuration file contents
- Error messages and stack traces
- Steps to reproduce the issue

This troubleshooting guide should help resolve most common audit configuration issues. For complex issues, enable debug logging and follow the diagnostic procedures outlined above.
