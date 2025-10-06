// Audit Types and Interfaces

/**
 * Enumeration of all write operation types that can be audited in the RabbitMQ admin system.
 * These operations represent all possible write actions that users can perform on RabbitMQ clusters.
 */
export enum AuditOperationType {
    /** Creating a new exchange */
    CREATE_EXCHANGE = 'CREATE_EXCHANGE',

    /** Deleting an existing exchange */
    DELETE_EXCHANGE = 'DELETE_EXCHANGE',

    /** Creating a new queue */
    CREATE_QUEUE = 'CREATE_QUEUE',

    /** Deleting an existing queue */
    DELETE_QUEUE = 'DELETE_QUEUE',

    /** Purging all messages from a queue */
    PURGE_QUEUE = 'PURGE_QUEUE',

    /** Creating a binding between an exchange and another exchange or queue */
    CREATE_BINDING_EXCHANGE = 'CREATE_BINDING_EXCHANGE',

    /** Creating a binding between a queue and an exchange */
    CREATE_BINDING_QUEUE = 'CREATE_BINDING_QUEUE',

    /** Deleting a binding */
    DELETE_BINDING = 'DELETE_BINDING',

    /** Publishing a message to an exchange */
    PUBLISH_MESSAGE_EXCHANGE = 'PUBLISH_MESSAGE_EXCHANGE',

    /** Publishing a message directly to a queue */
    PUBLISH_MESSAGE_QUEUE = 'PUBLISH_MESSAGE_QUEUE',

    /** Moving messages from one queue to another */
    MOVE_MESSAGES_QUEUE = 'MOVE_MESSAGES_QUEUE'
}

/**
 * Enumeration representing the status of an audited write operation.
 * This indicates whether the operation completed successfully, failed, or had partial success.
 */
export enum AuditOperationStatus {
    /** The operation completed successfully without any errors */
    SUCCESS = 'SUCCESS',

    /** The operation failed completely and no changes were made */
    FAILURE = 'FAILURE',

    /** The operation had partial success - some parts succeeded while others failed */
    PARTIAL = 'PARTIAL'
}

/**
 * Interface representing an audit record matching the backend DTO structure.
 * Contains all audit record information for API responses.
 */
export interface AuditRecord {
    /** Unique identifier for the audit record */
    id: string;

    /** Username of the user who performed the operation */
    username: string;

    /** Name of the cluster where the operation was performed */
    clusterName: string;

    /** Type of operation that was performed */
    operationType: AuditOperationType;

    /** Type of resource that was affected (exchange, queue, binding, message) */
    resourceType: string;

    /** Name of the specific resource that was affected */
    resourceName: string;

    /** Additional details about the operation in JSON format */
    resourceDetails?: Record<string, any>;

    /** Status of the operation (success, failure, partial) */
    status: AuditOperationStatus;

    /** Error message if the operation failed */
    errorMessage?: string;

    /** UTC timestamp when the operation was performed */
    timestamp: string;

    /** IP address of the client that performed the operation */
    clientIp?: string;

    /** User agent string of the client that performed the operation */
    userAgent?: string;

    /** UTC timestamp when the audit record was created */
    createdAt?: string;
}

/**
 * Interface for audit record filtering requests.
 * Contains optional filter parameters for querying audit records.
 */
export interface AuditFilterRequest {
    /** Filter by username (partial match, case-insensitive) */
    username?: string;

    /** Filter by cluster name (partial match, case-insensitive) */
    clusterName?: string;

    /** Filter by specific operation type */
    operationType?: AuditOperationType;

    /** Filter by operation status */
    status?: AuditOperationStatus;

    /** Filter by resource name (partial match, case-insensitive) */
    resourceName?: string;

    /** Filter by resource type (exact match, multiple values allowed) */
    resourceType?: string | string[];

    /** Filter by operations performed after this time (ISO 8601 format) */
    startTime?: string;

    /** Filter by operations performed before this time (ISO 8601 format) */
    endTime?: string;
}

/**
 * Specialized PagedResponse type for audit records.
 * Extends the generic PagedResponse interface with AuditRecord items.
 */
export interface AuditRecordsPagedResponse {
    /** Array of audit records for the current page */
    items: AuditRecord[];

    /** Current page number (0-based) */
    page: number;

    /** Number of items per page */
    pageSize: number;

    /** Total number of audit records matching the filter criteria */
    totalItems: number;

    /** Total number of pages available */
    totalPages: number;

    /** Whether there is a next page available */
    hasNext: boolean;

    /** Whether there is a previous page available */
    hasPrevious: boolean;
}

/**
 * Type alias for the generic PagedResponse with AuditRecord type parameter.
 * This provides compatibility with the existing PagedResponse pattern.
 */
export type PagedAuditRecords = PagedResponse<AuditRecord>;

// Re-export PagedResponse from rabbitmq types for convenience
import type { PagedResponse } from './rabbitmq';
export type { PagedResponse };