package com.rabbitmq.admin.model;

/**
 * Enumeration representing the status of an audited write operation.
 * This indicates whether the operation completed successfully, failed, or had
 * partial success.
 */
public enum AuditOperationStatus {
    /**
     * The operation completed successfully without any errors
     */
    SUCCESS,

    /**
     * The operation failed completely and no changes were made
     */
    FAILURE,

    /**
     * The operation had partial success - some parts succeeded while others failed
     */
    PARTIAL
}