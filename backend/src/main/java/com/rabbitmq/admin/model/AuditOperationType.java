package com.rabbitmq.admin.model;

/**
 * Enumeration of all write operation types that can be audited in the RabbitMQ
 * admin system.
 * These operations represent all possible write actions that users can perform
 * on RabbitMQ clusters.
 */
public enum AuditOperationType {
    /**
     * Creating a new exchange
     */
    CREATE_EXCHANGE,

    /**
     * Deleting an existing exchange
     */
    DELETE_EXCHANGE,

    /**
     * Creating a new queue
     */
    CREATE_QUEUE,

    /**
     * Deleting an existing queue
     */
    DELETE_QUEUE,

    /**
     * Purging all messages from a queue
     */
    PURGE_QUEUE,

    /**
     * Creating a binding between an exchange and another exchange or queue
     */
    CREATE_BINDING_EXCHANGE,

    /**
     * Creating a binding between a queue and an exchange
     */
    CREATE_BINDING_QUEUE,

    /**
     * Deleting a binding
     */
    DELETE_BINDING,

    /**
     * Publishing a message to an exchange
     */
    PUBLISH_MESSAGE_EXCHANGE,

    /**
     * Publishing a message directly to a queue
     */
    PUBLISH_MESSAGE_QUEUE,

    /**
     * Moving messages from one queue to another
     */
    MOVE_MESSAGES_QUEUE
}