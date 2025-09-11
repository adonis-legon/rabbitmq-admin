-- V1__Initial_Schema.sql
-- Create initial database schema for users and cluster_connections tables

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMINISTRATOR', 'USER')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create cluster_connections table
CREATE TABLE cluster_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    api_url VARCHAR(500) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.username IS 'Unique username for authentication';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: ADMINISTRATOR or USER';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user was created';

COMMENT ON TABLE cluster_connections IS 'RabbitMQ cluster connection configurations';
COMMENT ON COLUMN cluster_connections.id IS 'Unique identifier for the cluster connection';
COMMENT ON COLUMN cluster_connections.name IS 'Display name for the cluster';
COMMENT ON COLUMN cluster_connections.api_url IS 'RabbitMQ Management API URL';
COMMENT ON COLUMN cluster_connections.username IS 'RabbitMQ API username';
COMMENT ON COLUMN cluster_connections.password IS 'RabbitMQ API password';
COMMENT ON COLUMN cluster_connections.description IS 'Optional description of the cluster';
COMMENT ON COLUMN cluster_connections.active IS 'Whether the connection is active';
COMMENT ON COLUMN cluster_connections.created_at IS 'Timestamp when connection was created';