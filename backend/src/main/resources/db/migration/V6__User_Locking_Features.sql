-- V6__User_Locking_Features.sql
-- Add user locking functionality and extend username length for email support

-- Extend username length to support email addresses and add locking fields
ALTER TABLE users 
    ALTER COLUMN username TYPE VARCHAR(100),
    ADD COLUMN locked BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN locked_at TIMESTAMP;

-- Add index for performance on locked status queries
CREATE INDEX idx_users_locked ON users(locked);
CREATE INDEX idx_users_failed_attempts ON users(failed_login_attempts);

-- Update existing users to have default values for new fields
UPDATE users SET 
    locked = FALSE,
    failed_login_attempts = 0,
    locked_at = NULL 
WHERE locked IS NULL OR failed_login_attempts IS NULL;

COMMENT ON COLUMN users.locked IS 'Indicates if the user account is locked due to failed login attempts';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_at IS 'Timestamp when the user was locked';