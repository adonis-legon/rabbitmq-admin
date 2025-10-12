# Audit Configuration Reference

This document provides comprehensive information about configuring the RabbitMQ Admin audit system for write operations.

## Overview

The audit system tracks all write operations performed on RabbitMQ clusters, providing a complete audit trail for compliance and security purposes. The system can be configured to meet different organizational requirements and deployment scenarios.

## Configuration Properties

All audit configuration properties are under the `app.audit.write-operations` prefix.

### Basic Configuration

```yaml
app:
  audit:
    write-operations:
      enabled: true # Enable/disable audit logging
      retention-days: 90 # Days to retain audit records
      batch-size: 100 # Batch size for processing
      async-processing: true # Enable asynchronous processing
```

### Property Details

#### `enabled`

- **Type**: Boolean
- **Default**: `false`
- **Required**: Yes
- **Description**: Controls whether write operations audit logging is enabled
- **Environment Variable**: `AUDIT_WRITE_OPERATIONS_ENABLED`

**Valid Values**:

- `true` - Enable audit logging for all write operations
- `false` - Disable audit logging (no audit records will be created)

**Examples**:

```yaml
# Enable audit logging
app.audit.write-operations.enabled: true

# Disable audit logging
app.audit.write-operations.enabled: false
```

#### `retention-days`

- **Type**: Integer
- **Default**: `90`
- **Required**: No
- **Range**: 1 to 36,500 (100 years)
- **Description**: Number of days to retain audit records before cleanup
- **Environment Variable**: `AUDIT_RETENTION_DAYS`

**Recommended Values**:

- **Development**: 7-30 days
- **Staging**: 30-90 days
- **Production**: 90-365 days
- **Compliance**: 365+ days

**Examples**:

```yaml
# Short retention for development
app.audit.write-operations.retention-days: 7

# Standard production retention
app.audit.write-operations.retention-days: 90

# Long-term compliance retention
app.audit.write-operations.retention-days: 2555  # 7 years
```

#### `batch-size`

- **Type**: Integer
- **Default**: `100`
- **Required**: No
- **Range**: 1 to 10,000
- **Description**: Batch size for processing audit records
- **Environment Variable**: `AUDIT_BATCH_SIZE`

**Performance Impact**:

- **Larger batches**: Better performance, higher memory usage
- **Smaller batches**: Lower memory usage, more database round trips

**Recommended Values**:

- **Development**: 10-50 (easier debugging)
- **Production**: 100-1000 (balanced performance)
- **High-volume**: 500-1000 (maximum performance)

**Examples**:

```yaml
# Small batch for development
app.audit.write-operations.batch-size: 10

# Standard production batch
app.audit.write-operations.batch-size: 100

# High-performance batch
app.audit.write-operations.batch-size: 500
```

#### `async-processing`

- **Type**: Boolean
- **Default**: `true`
- **Required**: Yes
- **Description**: Whether to process audit records asynchronously
- **Environment Variable**: `AUDIT_ASYNC_PROCESSING`

**Trade-offs**:

- **Asynchronous (`true`)**:
  - Better write operation performance
  - Audit records may be delayed
  - Recommended for production
- **Synchronous (`false`)**:
  - Immediate audit record creation
  - May impact write operation performance
  - Easier debugging and testing

**Examples**:

```yaml
# Asynchronous processing (production)
app.audit.write-operations.async-processing: true

# Synchronous processing (development)
app.audit.write-operations.async-processing: false
```

## Audit Retention Configuration

The audit retention system automatically cleans up old audit records based on retention policies. This prevents the audit database from growing indefinitely and maintains performance.

### Configuration Properties

All audit retention configuration properties are under the `app.audit.retention` prefix.

```yaml
app:
  audit:
    retention:
      enabled: true # Enable/disable automatic cleanup
      days: 90 # Number of days to retain audit records
      clean-schedule: "0 0 0 * * ?" # CRON expression for cleanup schedule
```

### Property Details

#### `enabled`

- **Type**: Boolean
- **Default**: `true`
- **Required**: Yes
- **Description**: Controls whether automatic audit retention cleanup is enabled
- **Environment Variable**: `AUDIT_RETENTION_ENABLED`

**Valid Values**:

- `true` - Enable automatic cleanup of old audit records
- `false` - Disable automatic cleanup (manual cleanup still possible)

**Examples**:

```yaml
# Enable automatic cleanup
app.audit.retention.enabled: true

# Disable automatic cleanup
app.audit.retention.enabled: false
```

#### `days`

- **Type**: Integer
- **Default**: `90`
- **Required**: Yes
- **Range**: 1 to 36,500 (100 years)
- **Description**: Number of days to retain audit records before cleanup
- **Environment Variable**: `AUDIT_RETENTION_DAYS`

**Recommendations**:

- **Development**: 7-30 days
- **Production**: 90-365 days
- **Compliance environments**: 365+ days

**Examples**:

```yaml
# Short retention for development
app.audit.retention.days: 7

# Standard production retention
app.audit.retention.days: 90

# Long-term compliance retention
app.audit.retention.days: 365
```

#### `clean-schedule`

- **Type**: String (CRON expression)
- **Default**: `"0 0 0 * * ?"` (daily at midnight)
- **Required**: Yes
- **Description**: CRON expression defining when the cleanup task runs
- **Environment Variable**: `AUDIT_RETENTION_CLEAN_SCHEDULE`

**Common CRON Expressions**:

- `"0 0 0 * * ?"` - Daily at midnight
- `"0 0 2 * * ?"` - Daily at 2 AM
- `"0 0 0 * * SUN"` - Weekly on Sunday at midnight
- `"0 0 0 1 * ?"` - Monthly on the 1st at midnight

**Examples**:

```yaml
# Daily cleanup at midnight
app.audit.retention.clean-schedule: "0 0 0 * * ?"

# Daily cleanup at 2 AM (avoid peak hours)
app.audit.retention.clean-schedule: "0 0 2 * * ?"

# Weekly cleanup on Sunday at midnight
app.audit.retention.clean-schedule: "0 0 0 * * SUN"
```

### Retention Configuration Examples

#### Development Environment

```yaml
app:
  audit:
    retention:
      enabled: true
      days: 7
      clean-schedule: "0 0 1 * * ?" # 1 AM cleanup
```

#### Production Environment

```yaml
app:
  audit:
    retention:
      enabled: true
      days: 90
      clean-schedule: "0 0 0 * * ?" # Midnight cleanup
```

#### Compliance Environment

```yaml
app:
  audit:
    retention:
      enabled: true
      days: 2555 # 7 years
      clean-schedule: "0 0 0 1 * ?" # Monthly cleanup
```

### Performance Considerations

- **Batch Processing**: The retention service processes deletions in batches of 1000 records to optimize performance
- **Off-Peak Scheduling**: Schedule cleanup during low-usage periods (typically early morning hours)
- **Transaction Management**: All cleanup operations are transactional to ensure data consistency
- **Monitoring**: The service logs detailed information about cleanup operations for monitoring

### Manual Cleanup

The retention service also supports manual cleanup through the `AuditRetentionService.performManualCleanup()` method, which can be useful for:

- Testing retention policies
- One-time cleanup operations
- Administrative maintenance

## Environment-Specific Configurations

### Development Environment

```yaml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 7
      batch-size: 10
      async-processing: false
```

**Rationale**:

- Short retention to save storage
- Small batch size for easier debugging
- Synchronous processing for immediate feedback

### Staging Environment

```yaml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 30
      batch-size: 50
      async-processing: true
```

**Rationale**:

- Medium retention for testing scenarios
- Moderate batch size for balanced performance
- Asynchronous processing to match production

### Production Environment

```yaml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 90
      batch-size: 500
      async-processing: true
```

**Rationale**:

- Standard retention for business needs
- Large batch size for optimal performance
- Asynchronous processing for best performance

### High-Compliance Environment

```yaml
app:
  audit:
    write-operations:
      enabled: true
      retention-days: 2555 # 7 years
      batch-size: 100
      async-processing: true
```

**Rationale**:

- Long retention for regulatory compliance
- Moderate batch size for stability
- Asynchronous processing for performance

### Disabled Audit Environment

```yaml
app:
  audit:
    write-operations:
      enabled: false
      retention-days: 90
      batch-size: 100
      async-processing: true
```

**Rationale**:

- Audit disabled for environments where not needed
- Default values maintained for easy re-enabling

## Environment Variable Configuration

All configuration properties can be overridden using environment variables:

```bash
# Enable audit logging
export AUDIT_WRITE_OPERATIONS_ENABLED=true

# Set retention to 30 days
export AUDIT_RETENTION_DAYS=30

# Set batch size to 200
export AUDIT_BATCH_SIZE=200

# Enable asynchronous processing
export AUDIT_ASYNC_PROCESSING=true
```

### Docker Environment Variables

```dockerfile
ENV AUDIT_WRITE_OPERATIONS_ENABLED=true
ENV AUDIT_RETENTION_DAYS=90
ENV AUDIT_BATCH_SIZE=500
ENV AUDIT_ASYNC_PROCESSING=true
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: audit-config
data:
  AUDIT_WRITE_OPERATIONS_ENABLED: "true"
  AUDIT_RETENTION_DAYS: "90"
  AUDIT_BATCH_SIZE: "500"
  AUDIT_ASYNC_PROCESSING: "true"
```

## Configuration Validation

The system validates all configuration properties at startup:

### Validation Rules

1. **enabled**: Must not be null
2. **retention-days**: Must be between 1 and 36,500
3. **batch-size**: Must be between 1 and 10,000
4. **async-processing**: Must not be null

### Validation Error Messages

| Property         | Invalid Value | Error Message                                                                                            |
| ---------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| enabled          | null          | "Audit enabled flag must not be null. Use true or false."                                                |
| retention-days   | 0 or negative | "Retention days must be at least 1. Consider using 7 days for development or 90+ days for production."   |
| retention-days   | > 36,500      | "Retention days cannot exceed 36500 (100 years). Consider using a reasonable value like 365 days."       |
| batch-size       | 0 or negative | "Batch size must be at least 1. Consider using 10 for development or 100+ for production."               |
| batch-size       | > 10,000      | "Batch size cannot exceed 10000. Consider using a smaller value like 1000 for better memory management." |
| async-processing | null          | "Async processing flag must not be null. Use true for production or false for development."              |

## Configuration Refresh

The audit configuration supports runtime refresh without application restart:

### Using Spring Boot Actuator

```bash
# Refresh configuration
curl -X POST http://localhost:8080/actuator/refresh
```

### Configuration Changes

After updating configuration properties (in application.yml or environment variables), use the refresh endpoint to apply changes immediately.

**Note**: Some changes may require component restart, which is handled automatically by Spring's conditional bean creation.

## Monitoring Configuration

### Health Checks

The audit system provides health indicators:

```bash
# Check audit system health
curl http://localhost:8080/actuator/health/audit
```

### Configuration Metrics

Monitor configuration effectiveness:

```bash
# View audit metrics
curl http://localhost:8080/actuator/metrics/audit.records.created
curl http://localhost:8080/actuator/metrics/audit.batch.processing.time
```

## Troubleshooting

### Common Configuration Issues

1. **Audit not working**:

   - Check `enabled` is set to `true`
   - Verify database connectivity
   - Check application logs for validation errors

2. **Performance issues**:

   - Increase `batch-size` for better throughput
   - Enable `async-processing` for production
   - Monitor database performance

3. **Storage issues**:

   - Reduce `retention-days` to save space
   - Implement database partitioning for large datasets
   - Monitor disk usage

4. **Configuration validation errors**:
   - Check property values are within valid ranges
   - Ensure boolean properties are not null
   - Verify environment variable syntax

### Debug Configuration

Enable debug logging for configuration:

```yaml
logging:
  level:
    com.rabbitmq.admin.config: DEBUG
    org.springframework.boot.context.properties: DEBUG
```

## Security Considerations

1. **Access Control**: Audit configuration should only be modifiable by administrators
2. **Environment Variables**: Secure environment variables in production
3. **Configuration Files**: Protect configuration files with appropriate permissions
4. **Audit Trail**: Changes to audit configuration should themselves be audited

## Best Practices

1. **Environment Consistency**: Use environment variables for environment-specific values
2. **Validation**: Always validate configuration changes before deployment
3. **Monitoring**: Monitor audit system performance and storage usage
4. **Documentation**: Document any custom configuration decisions
5. **Testing**: Test configuration changes in non-production environments first
6. **Backup**: Backup audit configuration along with application configuration
