# Database Schema Documentation

## Overview

This document describes the database schema for the RabbitMQ Admin application, including tables, relationships, and key constraints.

## Database Structure

The application uses PostgreSQL as the primary database with the following main entities:

- **Users**: Application users with role-based access
- **Cluster Connections**: RabbitMQ cluster connection configurations
- **User Cluster Assignments**: Many-to-many relationship between users and clusters
- **Audit Records**: Comprehensive audit trail for all write operations on RabbitMQ clusters

## Tables

### users

Stores application user accounts and authentication information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `id`: Unique identifier (UUID)
- `username`: Unique username for login (max 50 characters)
- `email`: Unique email address (max 100 characters)
- `password_hash`: BCrypt hashed password
- `role`: User role (`USER` or `ADMINISTRATOR`)
- `active`: Whether the user account is active
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**

- Primary key on `id`
- Unique constraints on `username` and `email`
- Check constraint on `role` (must be 'USER' or 'ADMINISTRATOR')

### cluster_connections

Stores RabbitMQ cluster connection configurations.

```sql
CREATE TABLE cluster_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    api_url VARCHAR(500) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `id`: Unique identifier (UUID)
- `name`: Unique cluster connection name (max 100 characters)
- `api_url`: RabbitMQ Management API URL (max 500 characters)
- `username`: RabbitMQ username for authentication (max 100 characters)
- `password_hash`: Encrypted password for RabbitMQ authentication
- `description`: Optional description of the cluster connection
- `active`: Whether the cluster connection is active and available
- `created_at`: Connection creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**

- Primary key on `id`
- Unique constraint on `name`
- Not null constraints on required fields

### user_cluster_assignments

Junction table implementing many-to-many relationship between users and cluster connections.

```sql
CREATE TABLE user_cluster_assignments (
    user_id UUID NOT NULL,
    cluster_connection_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cluster_connection_id),
    CONSTRAINT fk_user_cluster_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_cluster_connection
        FOREIGN KEY (cluster_connection_id)
        REFERENCES cluster_connections(id)
        ON DELETE CASCADE
);
```

**Columns:**

- `user_id`: Reference to users table (UUID)
- `cluster_connection_id`: Reference to cluster_connections table (UUID)
- `assigned_at`: Timestamp when the assignment was created

**Constraints:**

- Composite primary key on `(user_id, cluster_connection_id)`
- Foreign key to `users(id)` with CASCADE delete
- Foreign key to `cluster_connections(id)` with CASCADE delete

### audit_records

Stores comprehensive audit trail for all write operations performed on RabbitMQ clusters.

```sql
CREATE TABLE audit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cluster_id UUID NOT NULL,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
        'CREATE_EXCHANGE',
        'DELETE_EXCHANGE',
        'CREATE_QUEUE',
        'DELETE_QUEUE',
        'PURGE_QUEUE',
        'CREATE_BINDING_EXCHANGE',
        'CREATE_BINDING_QUEUE',
        'DELETE_BINDING',
        'PUBLISH_MESSAGE_EXCHANGE',
        'PUBLISH_MESSAGE_QUEUE',
        'MOVE_MESSAGES_QUEUE'
    )),
    resource_type VARCHAR(100) NOT NULL,
    resource_name VARCHAR(500) NOT NULL,
    resource_details TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
    error_message VARCHAR(1000),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    client_ip VARCHAR(45),
    user_agent VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_audit_records_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_audit_records_cluster
        FOREIGN KEY (cluster_id)
        REFERENCES cluster_connections(id)
        ON DELETE RESTRICT
);
```

**Columns:**

- `id`: Unique identifier (UUID)
- `user_id`: Reference to the user who performed the operation
- `cluster_id`: Reference to the cluster where the operation was performed
- `operation_type`: Type of write operation (CREATE_EXCHANGE, DELETE_QUEUE, MOVE_MESSAGES_QUEUE, etc.)
- `resource_type`: Type of resource affected (exchange, queue, binding, message)
- `resource_name`: Name of the specific resource that was modified
- `resource_details`: JSON string containing operation-specific details
- `status`: Result status of the operation (SUCCESS, FAILURE, PARTIAL)
- `error_message`: Error message if the operation failed
- `timestamp`: UTC timestamp when the operation was performed
- `client_ip`: IP address of the client that initiated the operation
- `user_agent`: User agent string of the client
- `created_at`: Timestamp when the audit record was created

**Constraints:**

- Primary key on `id`
- Foreign key to `users(id)` with RESTRICT delete (preserves audit trail)
- Foreign key to `cluster_connections(id)` with RESTRICT delete (preserves audit trail)
- Check constraint on `operation_type` (must be one of the defined operation types)
- Check constraint on `status` (must be SUCCESS, FAILURE, or PARTIAL)

## Relationships

### User-Cluster Assignment Relationship

The application implements a many-to-many relationship between users and cluster connections:

- **One user** can be assigned to **multiple cluster connections**
- **One cluster connection** can have **multiple users** assigned to it
- **Assignment tracking**: Each assignment includes a timestamp for audit purposes
- **Cascade deletion**: Deleting a user or cluster connection automatically removes related assignments
- **Bidirectional integrity**: Assignment operations properly maintain both sides of the relationship to ensure data consistency

### Audit Trail Relationship

The audit system maintains a comprehensive record of all write operations:

- **Audit records** reference both **users** and **cluster connections**
- **RESTRICT deletion**: Users and clusters cannot be deleted if audit records exist
- **Immutable records**: Audit entries are designed to be tamper-evident and permanent
- **Operation tracking**: All write operations are captured with detailed context

### Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────────────┐         ┌─────────────────────┐
│     users       │         │ user_cluster_assignments │         │ cluster_connections │
├─────────────────┤         ├──────────────────────────┤         ├─────────────────────┤
│ id (PK)         │◄────────┤ user_id (FK)             │         │ id (PK)             │
│ username (UQ)   │         │ cluster_connection_id(FK)├────────►│ name (UQ)           │
│ email (UQ)      │         │ assigned_at              │         │ api_url             │
│ password_hash   │         └──────────────────────────┘         │ username            │
│ role            │                                              │ password_hash       │
│ active          │                                              │ description         │
│ created_at      │         ┌──────────────────────────┐         │ active              │
│ updated_at      │         │    audit_records         │         │ created_at          │
└─────────────────┘         ├──────────────────────────┤         │ updated_at          │
         │                  │ id (PK)                  │         └─────────────────────┘
         │                  │ user_id (FK)             │                      │
         └─────────────────►│ cluster_id (FK)          │◄─────────────────────┘
                            │ operation_type           │
                            │ resource_type            │
                            │ resource_name            │
                            │ resource_details         │
                            │ status                   │
                            │ error_message            │
                            │ timestamp                │
                            │ client_ip                │
                            │ user_agent               │
                            │ created_at               │
                            └──────────────────────────┘
```

## Indexes

### Automatic Indexes

PostgreSQL automatically creates indexes for:

- Primary keys (`users.id`, `cluster_connections.id`)
- Unique constraints (`users.username`, `users.email`, `cluster_connections.name`)

### Additional Indexes (V3 Migration)

```sql
-- Performance indexes for common queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_cluster_connections_active ON cluster_connections(active);
CREATE INDEX idx_user_cluster_assignments_user_id ON user_cluster_assignments(user_id);
CREATE INDEX idx_user_cluster_assignments_cluster_id ON user_cluster_assignments(cluster_connection_id);
CREATE INDEX idx_user_cluster_assignments_assigned_at ON user_cluster_assignments(assigned_at);
```

**Index Purposes:**

- `idx_users_role`: Optimize role-based queries
- `idx_users_active`: Filter active/inactive users
- `idx_cluster_connections_active`: Filter active/inactive clusters
- `idx_user_cluster_assignments_user_id`: Optimize user-to-cluster lookups
- `idx_user_cluster_assignments_cluster_id`: Optimize cluster-to-user lookups
- `idx_user_cluster_assignments_assigned_at`: Support assignment history queries

### Audit Indexes (V5 Migration)

```sql
-- Single column indexes for efficient filtering
CREATE INDEX idx_audit_records_user_id ON audit_records(user_id);
CREATE INDEX idx_audit_records_cluster_id ON audit_records(cluster_id);
CREATE INDEX idx_audit_records_timestamp ON audit_records(timestamp);
CREATE INDEX idx_audit_records_operation_type ON audit_records(operation_type);
CREATE INDEX idx_audit_records_resource_name ON audit_records(resource_name);
CREATE INDEX idx_audit_records_status ON audit_records(status);
CREATE INDEX idx_audit_records_created_at ON audit_records(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_records_user_timestamp ON audit_records(user_id, timestamp);
CREATE INDEX idx_audit_records_cluster_timestamp ON audit_records(cluster_id, timestamp);
CREATE INDEX idx_audit_records_user_cluster_timestamp ON audit_records(user_id, cluster_id, timestamp);
```

**Audit Index Purposes:**

- `idx_audit_records_user_id`: Filter audit records by user
- `idx_audit_records_cluster_id`: Filter audit records by cluster
- `idx_audit_records_timestamp`: Sort and filter by operation time
- `idx_audit_records_operation_type`: Filter by operation type
- `idx_audit_records_resource_name`: Search by resource name
- `idx_audit_records_status`: Filter by operation status
- `idx_audit_records_created_at`: Sort by audit record creation time
- `idx_audit_records_user_timestamp`: Optimize user activity queries over time
- `idx_audit_records_cluster_timestamp`: Optimize cluster activity queries over time
- `idx_audit_records_user_cluster_timestamp`: Optimize complex filtering scenarios

## Data Migration History

### V1\_\_Initial_Schema.sql

- Created `users` table with basic authentication fields
- Created `cluster_connections` table for RabbitMQ cluster management
- Established primary keys and basic constraints

### V2\_\_User_Cluster_Assignments.sql

- Added `user_cluster_assignments` junction table
- Implemented many-to-many relationship between users and clusters
- Added foreign key constraints with cascade deletion
- Added table and column comments for documentation

### V3\_\_Add_Indexes.sql

- Added performance indexes for common query patterns
- Optimized user role and status filtering
- Improved cluster connection and assignment lookup performance

### V4\_\_Default_Admin_User.sql

- Inserted default administrator user account
- Provides initial access for application setup
- Uses BCrypt hashed password for security

### V5\_\_Audit_Records_Schema.sql

- Created `audit_records` table for comprehensive write operation tracking
- Added foreign key relationships to users and cluster_connections with RESTRICT deletion
- Implemented check constraints for operation_type and status validation
- Added comprehensive indexing strategy for efficient audit queries
- Included detailed column comments for documentation

## Security Considerations

### Password Security

- All passwords are stored as BCrypt hashes (users and cluster connections)
- BCrypt work factor configured for appropriate security/performance balance
- Passwords are never stored in plain text

### Data Protection

- Foreign key constraints ensure referential integrity
- Cascade deletion prevents orphaned records
- Unique constraints prevent duplicate usernames and cluster names

### Access Control

- Role-based access control through `users.role` field
- Active/inactive status controls account and cluster availability
- Assignment-based access control for cluster resources

## Query Examples

### Common User Queries

```sql
-- Get all active users with their roles
SELECT id, username, email, role, created_at
FROM users
WHERE active = true
ORDER BY username;

-- Get administrators only
SELECT * FROM users
WHERE role = 'ADMINISTRATOR' AND active = true;

-- Count users by role
SELECT role, COUNT(*) as user_count
FROM users
WHERE active = true
GROUP BY role;
```

### Common Cluster Queries

```sql
-- Get all active cluster connections
SELECT id, name, api_url, description, created_at
FROM cluster_connections
WHERE active = true
ORDER BY name;

-- Get cluster connections with user count
SELECT
    cc.id,
    cc.name,
    cc.api_url,
    COUNT(uca.user_id) as assigned_user_count
FROM cluster_connections cc
LEFT JOIN user_cluster_assignments uca ON cc.id = uca.cluster_connection_id
WHERE cc.active = true
GROUP BY cc.id, cc.name, cc.api_url
ORDER BY cc.name;
```

### User Assignment Queries

```sql
-- Get clusters assigned to a specific user
SELECT cc.id, cc.name, cc.api_url, uca.assigned_at
FROM cluster_connections cc
JOIN user_cluster_assignments uca ON cc.id = uca.cluster_connection_id
WHERE uca.user_id = $1 AND cc.active = true
ORDER BY cc.name;

-- Get users assigned to a specific cluster
SELECT u.id, u.username, u.email, u.role, uca.assigned_at
FROM users u
JOIN user_cluster_assignments uca ON u.id = uca.user_id
WHERE uca.cluster_connection_id = $1 AND u.active = true
ORDER BY u.username;

-- Get users not assigned to a specific cluster
SELECT u.id, u.username, u.email, u.role
FROM users u
WHERE u.active = true
  AND u.id NOT IN (
    SELECT uca.user_id
    FROM user_cluster_assignments uca
    WHERE uca.cluster_connection_id = $1
  )
ORDER BY u.username;

-- Get assignment statistics
SELECT
    u.username,
    COUNT(uca.cluster_connection_id) as assigned_clusters
FROM users u
LEFT JOIN user_cluster_assignments uca ON u.id = uca.user_id
WHERE u.active = true
GROUP BY u.id, u.username
ORDER BY assigned_clusters DESC, u.username;
```

### Audit Record Queries

```sql
-- Get recent audit records with user and cluster information
SELECT
    ar.id,
    u.username,
    cc.name as cluster_name,
    ar.operation_type,
    ar.resource_type,
    ar.resource_name,
    ar.status,
    ar.timestamp,
    ar.error_message
FROM audit_records ar
JOIN users u ON ar.user_id = u.id
JOIN cluster_connections cc ON ar.cluster_id = cc.id
ORDER BY ar.timestamp DESC
LIMIT 100;

-- Get audit records for a specific user
SELECT
    ar.operation_type,
    ar.resource_type,
    ar.resource_name,
    ar.status,
    ar.timestamp,
    cc.name as cluster_name
FROM audit_records ar
JOIN cluster_connections cc ON ar.cluster_id = cc.id
WHERE ar.user_id = $1
ORDER BY ar.timestamp DESC;

-- Get audit records for a specific cluster
SELECT
    ar.operation_type,
    ar.resource_type,
    ar.resource_name,
    ar.status,
    ar.timestamp,
    u.username
FROM audit_records ar
JOIN users u ON ar.user_id = u.id
WHERE ar.cluster_id = $1
ORDER BY ar.timestamp DESC;

-- Get failed operations for investigation
SELECT
    ar.id,
    u.username,
    cc.name as cluster_name,
    ar.operation_type,
    ar.resource_name,
    ar.error_message,
    ar.timestamp,
    ar.client_ip
FROM audit_records ar
JOIN users u ON ar.user_id = u.id
JOIN cluster_connections cc ON ar.cluster_id = cc.id
WHERE ar.status = 'FAILURE'
ORDER BY ar.timestamp DESC;

-- Get operation statistics by type
SELECT
    ar.operation_type,
    COUNT(*) as total_operations,
    COUNT(CASE WHEN ar.status = 'SUCCESS' THEN 1 END) as successful,
    COUNT(CASE WHEN ar.status = 'FAILURE' THEN 1 END) as failed,
    ROUND(
        COUNT(CASE WHEN ar.status = 'SUCCESS' THEN 1 END) * 100.0 / COUNT(*), 2
    ) as success_rate
FROM audit_records ar
WHERE ar.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY ar.operation_type
ORDER BY total_operations DESC;

-- Get user activity summary
SELECT
    u.username,
    COUNT(ar.id) as total_operations,
    COUNT(DISTINCT ar.cluster_id) as clusters_accessed,
    COUNT(DISTINCT DATE(ar.timestamp)) as active_days,
    MAX(ar.timestamp) as last_activity
FROM users u
LEFT JOIN audit_records ar ON u.id = ar.user_id
WHERE u.active = true
GROUP BY u.id, u.username
ORDER BY total_operations DESC;

-- Get audit records with filtering (example for API)
SELECT
    ar.id,
    ar.user_id,
    u.username,
    ar.cluster_id,
    cc.name as cluster_name,
    ar.operation_type,
    ar.resource_type,
    ar.resource_name,
    ar.resource_details,
    ar.status,
    ar.error_message,
    ar.timestamp,
    ar.client_ip,
    ar.user_agent
FROM audit_records ar
JOIN users u ON ar.user_id = u.id
JOIN cluster_connections cc ON ar.cluster_id = cc.id
WHERE ($1::UUID IS NULL OR ar.user_id = $1)
  AND ($2::UUID IS NULL OR ar.cluster_id = $2)
  AND ($3::VARCHAR IS NULL OR ar.operation_type = $3)
  AND ($4::VARCHAR IS NULL OR ar.resource_name ILIKE '%' || $4 || '%')
  AND ($5::TIMESTAMP IS NULL OR ar.timestamp >= $5)
  AND ($6::TIMESTAMP IS NULL OR ar.timestamp <= $6)
ORDER BY ar.timestamp DESC
LIMIT $7 OFFSET $8;
```

## Maintenance and Monitoring

### Regular Maintenance Tasks

```sql
-- Clean up old assignment records (if needed)
DELETE FROM user_cluster_assignments
WHERE assigned_at < NOW() - INTERVAL '1 year'
  AND cluster_connection_id NOT IN (
    SELECT id FROM cluster_connections WHERE active = true
  );

-- Update statistics for query optimization
ANALYZE users;
ANALYZE cluster_connections;
ANALYZE user_cluster_assignments;
```

### Monitoring Queries

```sql
-- Check database size and table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor assignment distribution
SELECT
    'Total Users' as metric,
    COUNT(*) as count
FROM users WHERE active = true
UNION ALL
SELECT
    'Total Clusters' as metric,
    COUNT(*) as count
FROM cluster_connections WHERE active = true
UNION ALL
SELECT
    'Total Assignments' as metric,
    COUNT(*) as count
FROM user_cluster_assignments;
```

## Backup and Recovery

### Backup Strategy

- Regular full database backups using `pg_dump`
- Point-in-time recovery capability with WAL archiving
- Test restore procedures regularly

### Critical Data

- User accounts and authentication data
- Cluster connection configurations (excluding passwords)
- User-cluster assignment relationships
- Audit records (for compliance and security investigations)

### Recovery Considerations

- Passwords may need to be reset after recovery
- Cluster connection tests should be performed after restore
- User assignments should be verified for consistency
- Audit record integrity should be validated after restore
- Audit retention policies should be reviewed and reapplied
