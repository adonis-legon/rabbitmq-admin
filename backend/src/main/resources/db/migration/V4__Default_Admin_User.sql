-- V4__Default_Admin_User.sql
-- Insert default administrator account

-- Insert default admin user
-- Password: 'admin123!' (BCrypt hash with strength 12)
-- This should be changed immediately after first login in production
INSERT INTO users (id, username, password_hash, role, created_at) 
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$12$eOMGTKVzuIwWNMgvm7xHP.JCjXqf6ZoZltHOciH4FnzKPpWoU5iIG',
    'ADMINISTRATOR',
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- Add comment about default credentials
COMMENT ON TABLE users IS 'Application users with role-based access control. Default admin user: admin/admin123! (CHANGE IN PRODUCTION)';