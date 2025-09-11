-- V3__Add_Indexes.sql
-- Add performance optimization indexes

-- Index on users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Index on cluster_connections table
CREATE INDEX idx_cluster_connections_name ON cluster_connections(name);
CREATE INDEX idx_cluster_connections_active ON cluster_connections(active);
CREATE INDEX idx_cluster_connections_created_at ON cluster_connections(created_at);

-- Index on user_cluster_assignments table
CREATE INDEX idx_user_cluster_assignments_user_id ON user_cluster_assignments(user_id);
CREATE INDEX idx_user_cluster_assignments_cluster_id ON user_cluster_assignments(cluster_connection_id);
CREATE INDEX idx_user_cluster_assignments_assigned_at ON user_cluster_assignments(assigned_at);

-- Composite indexes for common queries
CREATE INDEX idx_users_username_role ON users(username, role);
CREATE INDEX idx_cluster_connections_active_name ON cluster_connections(active, name);