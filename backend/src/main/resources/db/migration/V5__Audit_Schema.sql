-- V5__Audit_Schema.sql
-- Create audits table for tracking write operations on RabbitMQ clusters

-- Create audits table with correct column types to match JPA entity
CREATE TABLE audits (
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
    CONSTRAINT fk_audits_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT,
    CONSTRAINT fk_audits_cluster 
        FOREIGN KEY (cluster_id) 
        REFERENCES cluster_connections(id) 
        ON DELETE RESTRICT
);

-- Create indexes for efficient querying
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_cluster_id ON audits(cluster_id);
CREATE INDEX idx_audits_operation_type ON audits(operation_type);
CREATE INDEX idx_audits_timestamp ON audits(timestamp);
CREATE INDEX idx_audits_resource_name ON audits(resource_name);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_audits_user_timestamp ON audits(user_id, timestamp);
CREATE INDEX idx_audits_cluster_timestamp ON audits(cluster_id, timestamp);
CREATE INDEX idx_audits_user_cluster_timestamp ON audits(user_id, cluster_id, timestamp);

-- Add comments for documentation
COMMENT ON TABLE audits IS 'Audit trail for all write operations performed on RabbitMQ clusters';
COMMENT ON COLUMN audits.id IS 'Unique identifier for the audit record';
COMMENT ON COLUMN audits.user_id IS 'Reference to the user who performed the operation';
COMMENT ON COLUMN audits.cluster_id IS 'Reference to the cluster where the operation was performed';
COMMENT ON COLUMN audits.operation_type IS 'Type of write operation performed (enum as VARCHAR)';
COMMENT ON COLUMN audits.resource_type IS 'Type of resource affected (exchange, queue, binding, message)';
COMMENT ON COLUMN audits.resource_name IS 'Name of the specific resource that was modified';
COMMENT ON COLUMN audits.resource_details IS 'JSON string containing operation-specific details';
COMMENT ON COLUMN audits.status IS 'Result status of the operation (SUCCESS, FAILURE, PARTIAL)';
COMMENT ON COLUMN audits.error_message IS 'Error message if the operation failed';
COMMENT ON COLUMN audits.timestamp IS 'UTC timestamp when the operation was performed';
COMMENT ON COLUMN audits.client_ip IS 'IP address of the client that initiated the operation';
COMMENT ON COLUMN audits.user_agent IS 'User agent string of the client';
COMMENT ON COLUMN audits.created_at IS 'Timestamp when the audit record was created';