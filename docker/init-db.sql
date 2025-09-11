-- Initialize database for RabbitMQ Admin
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (handled by POSTGRES_DB env var)
-- Create the user if it doesn't exist (handled by POSTGRES_USER env var)

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE rabbitmq_admin TO rabbitmq_admin;