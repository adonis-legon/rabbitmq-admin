# RabbitMQ Write Operations User Guide

This guide covers all the write operations available in the RabbitMQ Admin application, allowing you to create, modify, and delete RabbitMQ resources, as well as perform message operations.

## Table of Contents

1. [Overview](#overview)
2. [Exchange Operations](#exchange-operations)
3. [Queue Operations](#queue-operations)
4. [Binding Operations](#binding-operations)
5. [Message Operations](#message-operations)
6. [Security and Permissions](#security-and-permissions)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The RabbitMQ Admin application provides comprehensive write operations that allow you to:

- **Create and delete exchanges** with various types and configurations
- **Create and delete queues** with custom properties and arguments
- **Create bindings** between exchanges and queues to define routing rules
- **Publish messages** to exchanges and queues for testing and data delivery
- **Consume messages** from queues with different acknowledgment modes
- **Purge queues** to remove all messages during maintenance

All operations respect the existing security model - you can only perform operations on clusters you have access to, and operations will fail gracefully if the cluster connection lacks the necessary permissions.

## Exchange Operations

### Creating Exchanges

1. Navigate to the **Exchanges** page for your cluster
2. Click the **"Create Exchange"** button
3. Fill out the exchange creation form:

   - **Exchange Name**: Unique name for the exchange (required)
   - **Exchange Type**: Select from direct, fanout, topic, or headers
   - **Virtual Host**: Choose from available virtual hosts
   - **Durability**: Check to make the exchange survive server restarts
   - **Auto-delete**: Check to delete when no longer in use
   - **Internal**: Check to make the exchange internal (not directly publishable)
   - **Arguments**: Add custom key-value arguments if needed

4. Click **"Create"** to create the exchange

**Example Use Cases:**

- **Direct Exchange**: For point-to-point messaging with exact routing key matches
- **Topic Exchange**: For publish-subscribe patterns with wildcard routing
- **Fanout Exchange**: For broadcasting messages to all bound queues
- **Headers Exchange**: For routing based on message headers

### Deleting Exchanges

1. Find the exchange in the **Exchanges** list
2. Click the **Actions** menu (⋮) for the exchange
3. Select **"Delete Exchange"**
4. In the confirmation dialog:
   - Check **"If Unused"** to only delete if no queues are bound
   - Click **"Delete"** to confirm

**Warning**: Deleting an exchange will remove all its bindings and stop message routing through it.

### Publishing Messages to Exchanges

1. Find the exchange in the **Exchanges** list
2. Click the **Actions** menu (⋮) for the exchange
3. Select **"Publish Message"**
4. Fill out the message form:

   - **Routing Key**: Key used for routing (required for direct/topic exchanges)
   - **Message Properties**: Set delivery mode, priority, expiration, etc.
   - **Message Headers**: Add custom headers as key-value pairs
   - **Message Payload**: Enter your message content
   - **Payload Encoding**: Choose string or base64 encoding

5. Click **"Publish"** to send the message

The system will show whether the message was successfully routed to any queues.

## Queue Operations

### Creating Queues

1. Navigate to the **Queues** page for your cluster
2. Click the **"Create Queue"** button
3. Fill out the queue creation form:

   - **Queue Name**: Unique name for the queue (required)
   - **Virtual Host**: Choose from available virtual hosts
   - **Durability**: Check to make the queue survive server restarts
   - **Auto-delete**: Check to delete when no consumers are connected
   - **Exclusive**: Check to make the queue exclusive to one connection
   - **Arguments**: Add custom key-value arguments (TTL, max length, etc.)

4. Click **"Create"** to create the queue

**Common Arguments:**

- `x-message-ttl`: Message time-to-live in milliseconds
- `x-max-length`: Maximum number of messages in the queue
- `x-max-length-bytes`: Maximum total size of messages in bytes
- `x-dead-letter-exchange`: Exchange for expired/rejected messages

### Publishing Messages to Queues

1. Find the queue in the **Queues** list
2. Click the **Actions** menu (⋮) for the queue
3. Select **"Publish Message"**
4. Fill out the message form:

   - **Message Properties**: Set delivery mode, priority, etc.
   - **Message Headers**: Add custom headers
   - **Message Payload**: Enter your message content

5. Click **"Publish"** to send the message directly to the queue

This uses the default exchange with the queue name as the routing key.

### Consuming Messages from Queues

1. Find the queue in the **Queues** list
2. Click the **Actions** menu (⋮) for the queue
3. Select **"Get Messages"**
4. Configure message retrieval:

   - **Message Count**: Number of messages to retrieve (1-100)
   - **Acknowledgment Mode**: Choose how to handle retrieved messages:
     - **Ack and Requeue**: Acknowledge and return to queue
     - **Ack and Remove**: Acknowledge and remove from queue
     - **Reject and Requeue**: Reject and return to queue
     - **Reject and Remove**: Reject and remove from queue
   - **Encoding**: Auto-detect or force base64 encoding

5. Click **"Get Messages"** to retrieve messages

Retrieved messages will be displayed with their properties, headers, and payload content.

### Purging Queues

1. Find the queue in the **Queues** list
2. Click the **Actions** menu (⋮) for the queue
3. Select **"Purge Queue"**
4. Confirm the operation in the dialog

**Warning**: Purging removes all messages from the queue permanently. This operation cannot be undone.

### Deleting Queues

1. Find the queue in the **Queues** list
2. Click the **Actions** menu (⋮) for the queue
3. Select **"Delete Queue"**
4. In the confirmation dialog:
   - Check **"If Empty"** to only delete if the queue has no messages
   - Check **"If Unused"** to only delete if the queue has no consumers
   - Click **"Delete"** to confirm

**Warning**: Deleting a queue removes all its messages and bindings permanently.

## Binding Operations

Bindings define how messages are routed from exchanges to queues or other exchanges.

### Creating Exchange-to-Queue Bindings

1. Find the exchange in the **Exchanges** list
2. Click the **Actions** menu (⋮) for the exchange
3. Select **"Create Binding"**
4. Fill out the binding form:

   - **Destination Queue**: Name of the target queue
   - **Routing Key**: Key pattern for message routing
   - **Arguments**: Additional binding arguments if needed

5. Click **"Create Binding"** to establish the routing rule

### Creating Queue-to-Exchange Bindings

1. Find the queue in the **Queues** list
2. Click the **Actions** menu (⋮) for the queue
3. Select **"Create Binding"**
4. Fill out the binding form:

   - **Source Exchange**: Name of the source exchange
   - **Routing Key**: Key pattern for message routing
   - **Arguments**: Additional binding arguments

5. Click **"Create Binding"** to establish the routing rule

**Routing Key Patterns:**

- **Direct Exchange**: Exact match (e.g., "user.created")
- **Topic Exchange**: Wildcard patterns (e.g., "user._", "_.created", "#")
- **Fanout Exchange**: Ignored (all messages are routed)
- **Headers Exchange**: Use arguments instead of routing key

## Message Operations

### Message Properties

When publishing messages, you can set various properties:

- **Delivery Mode**: 1 (non-persistent) or 2 (persistent)
- **Priority**: Message priority (0-255)
- **Expiration**: Message TTL in milliseconds
- **Message ID**: Unique identifier for the message
- **Timestamp**: Message timestamp
- **Type**: Message type identifier
- **User ID**: Publishing user identifier
- **App ID**: Publishing application identifier
- **Cluster ID**: Cluster identifier

### Message Headers

Custom headers can be added as key-value pairs. Headers are useful for:

- Application-specific metadata
- Routing decisions in headers exchanges
- Message filtering and processing logic

### Payload Encoding

Messages support two encoding types:

- **String**: UTF-8 text content (default)
- **Base64**: Binary data or when UTF-8 encoding fails

The system automatically handles encoding/decoding for display purposes.

## Security and Permissions

### Authentication Requirements

All write operations require authentication. If your session expires during an operation, you'll be prompted to log in again.

### Authorization Model

- Both **USER** and **ADMINISTRATOR** roles can perform write operations
- Operations are performed using the cluster connection's credentials
- RabbitMQ server-side permissions are enforced for all operations
- Users can only access clusters they have been assigned to

### Permission Errors

If an operation fails due to insufficient permissions, you'll see error messages like:

- "Access refused for user 'username' to vhost '/'"
- "Operation not permitted on exchange 'amq.direct'"
- "Queue 'system-queue' is exclusive to another connection"

Contact your RabbitMQ administrator to adjust permissions if needed.

## Best Practices

### Exchange Management

1. **Use descriptive names** that indicate the exchange's purpose
2. **Choose the right type** for your messaging pattern:
   - Direct for point-to-point
   - Topic for publish-subscribe with routing
   - Fanout for broadcasting
   - Headers for complex routing logic
3. **Make exchanges durable** for production workloads
4. **Avoid deleting system exchanges** (those starting with "amq.")

### Queue Management

1. **Set appropriate durability** based on message importance
2. **Configure TTL and max-length** to prevent unbounded growth
3. **Use dead letter exchanges** for handling failed messages
4. **Monitor queue depth** and consumer count regularly
5. **Test queue deletion** in non-production environments first

### Message Operations

1. **Use appropriate acknowledgment modes** when consuming:
   - Ack and remove for processing messages
   - Ack and requeue for inspection without consumption
2. **Set delivery mode to 2** for important messages
3. **Include meaningful headers** for message tracing
4. **Test routing** with small messages before bulk operations
5. **Monitor message rates** to avoid overwhelming consumers

### Binding Strategy

1. **Design routing keys** with future expansion in mind
2. **Use topic exchanges** for flexible routing patterns
3. **Document binding logic** for team understanding
4. **Test routing patterns** thoroughly before production use
5. **Avoid circular bindings** between exchanges

## Troubleshooting

### Common Issues

**Exchange Creation Fails**

- Check exchange name doesn't already exist
- Verify virtual host exists and is accessible
- Ensure you have configure permissions on the vhost

**Queue Creation Fails**

- Check queue name doesn't already exist
- Verify virtual host permissions
- Check for invalid arguments (e.g., negative TTL values)

**Message Publishing Fails**

- Verify exchange exists and is accessible
- Check routing key format for exchange type
- Ensure message payload is valid for selected encoding
- Verify write permissions on the exchange

**Message Not Routed**

- Check if any queues are bound to the exchange
- Verify routing key matches binding patterns
- Confirm queue exists and is accessible
- Check exchange type and routing logic

**Binding Creation Fails**

- Verify source exchange exists
- Check destination queue/exchange exists
- Ensure routing key format is valid for exchange type
- Verify bind permissions on both source and destination

### Error Messages

**"Exchange already exists"**

- Choose a different exchange name or delete the existing one

**"Queue already exists"**

- Choose a different queue name or use the existing queue

**"No such vhost"**

- Select a valid virtual host from the dropdown

**"Access refused"**

- Contact your administrator for proper permissions

**"Precondition failed"**

- Check conditional deletion parameters (if-unused, if-empty)

### Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs for detailed error messages
2. Verify your RabbitMQ cluster is healthy and accessible
3. Confirm your user account has the necessary permissions
4. Test operations with simple configurations first
5. Contact your system administrator for cluster-specific issues

For more information about RabbitMQ concepts and configuration, refer to the [official RabbitMQ documentation](https://www.rabbitmq.com/documentation.html).
