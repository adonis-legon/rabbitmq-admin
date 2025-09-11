package com.rabbitmq.admin.model;

/**
 * Enumeration representing the different roles a user can have in the system.
 */
public enum UserRole {
    /**
     * Administrator role with full access to all features including user management
     * and cluster connection management.
     */
    ADMINISTRATOR,

    /**
     * Regular user role with access to assigned cluster connections only.
     */
    USER
}