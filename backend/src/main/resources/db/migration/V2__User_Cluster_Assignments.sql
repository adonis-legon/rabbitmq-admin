-- V2__User_Cluster_Assignments.sql
-- Create many-to-many relationship table between users and cluster connections

-- Create user_cluster_assignments junction table
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

-- Add comments for documentation
COMMENT ON TABLE user_cluster_assignments IS 'Many-to-many relationship between users and cluster connections';
COMMENT ON COLUMN user_cluster_assignments.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_cluster_assignments.cluster_connection_id IS 'Reference to cluster_connections table';
COMMENT ON COLUMN user_cluster_assignments.assigned_at IS 'Timestamp when assignment was created';