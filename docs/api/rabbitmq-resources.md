# RabbitMQ Resource Management API

This document describes the RabbitMQ Resource Management API endpoints that provide read-only access to RabbitMQ cluster resources.

## Overview

The RabbitMQ Resource Management API allows authenticated users to browse, inspect, and manage resources from their assigned RabbitMQ clusters. The API provides both read-only access for resource inspection and write operations for resource management including creating, modifying, and deleting RabbitMQ resources. All endpoints require authentication and users can only access clusters they have been assigned to.

**Architecture Note**: The API has been migrated from a reactive (WebFlux/Mono-based) to a synchronous (blocking) architecture for improved simplicity and debugging capabilities while maintaining high performance through optimized connection pooling and caching.

**Frontend Integration**: The resource management interface supports direct URL navigation to specific resource pages (e.g., `/resources/connections`, `/resources/queues`) through client-side routing, enabling bookmarking and direct linking to resource views. The application includes enhanced loading state management to prevent premature redirects during page refreshes and initial navigation.

## Base URL

```
/api/rabbitmq/{clusterId}/resources
```

Where `{clusterId}` is the UUID of the cluster connection.

**API Structure:**

- **Resource Management Endpoints**: `/api/rabbitmq/{clusterId}/resources/*` - Paginated access to RabbitMQ resources (connections, channels, exchanges, queues) with write operations
- **Cluster Management Endpoints**: `/api/rabbitmq/{clusterId}/*` - Direct cluster-level operations (virtual hosts, overview, nodes, etc.)

**Note**: Virtual hosts are accessed via the cluster management endpoint (`/api/rabbitmq/{clusterId}/vhosts`) as they are cluster-level metadata, not paginated resources.

## URL Encoding

The API uses a specific encoding scheme for path parameters to handle special characters safely:

### Virtual Host Encoding

Virtual host names are **Base64 encoded** to handle special characters, particularly the default virtual host `/`:

```bash
# Default vhost "/" becomes "Lw=="
echo -n "/" | base64  # Returns: Lw==

# Custom vhost "production" becomes "cHJvZHVjdGlvbg=="
echo -n "production" | base64  # Returns: cHJvZHVjdGlvbg==
```

### Resource Name Encoding

Exchange names, queue names, and other resource identifiers are **URL encoded** using standard percent-encoding:

```bash
# Queue name "my-queue" remains "my-queue" (no special characters)
# Queue name "my queue" becomes "my%20queue" (space encoded)
# Exchange name "user.events" remains "user.events" (dots are safe in URLs)
```

### Example URLs

```bash
# Get bindings for exchange "user.events" in default vhost "/"
GET /api/rabbitmq/{clusterId}/resources/exchanges/Lw==/user.events/bindings

# Create binding in production vhost
POST /api/rabbitmq/{clusterId}/resources/bindings/cHJvZHVjdGlvbg==/e/source-exchange/q/target-queue

# Delete queue with spaces in name from default vhost
DELETE /api/rabbitmq/{clusterId}/resources/queues/Lw==/my%20queue
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

**Token Expiration Handling**: The frontend application automatically handles token expiration with seamless navigation to the login page. After successful login, users are always redirected to the dashboard for a consistent user experience.

**Loading State Management**: The application properly handles page refreshes and initial loading states to prevent premature redirects. Users can safely refresh resource pages or navigate directly to resource URLs without being unexpectedly redirected during the loading process.

## Common Query Parameters

All resource endpoints support the following pagination and filtering parameters:

| Parameter  | Type    | Default | Description                         |
| ---------- | ------- | ------- | ----------------------------------- |
| `page`     | integer | 0       | Page number (0-based)               |
| `pageSize` | integer | 50      | Number of items per page (max: 500) |
| `name`     | string  | -       | Optional name filter                |
| `useRegex` | boolean | false   | Use regex for name filtering        |

## Response Format

All endpoints return paginated responses in the following format:

```json
{
  "items": [...],
  "page": 0,
  "pageSize": 50,
  "totalItems": 150,
  "totalPages": 3,
  "hasNext": true,
  "hasPrevious": false
}
```

## Testing and Validation

The API includes comprehensive testing at multiple levels to ensure reliability and correctness:

### DTO Validation Testing

All write operation DTOs are validated through `DtoValidationComprehensiveTest` which ensures:

- **Validation Constraints**: All Jakarta validation annotations are properly enforced
- **Serialization**: JSON serialization and deserialization work correctly for all DTOs
- **Null Safety**: Constructors and setters handle null values gracefully with appropriate defaults
- **Complex Data**: Nested objects and complex arguments are properly handled
- **Edge Cases**: Invalid data triggers appropriate validation errors

### Integration Testing

The API includes comprehensive integration tests through `RabbitMQWriteOperationsIntegrationTest` which covers:

- **Endpoint Integration**: All write operation endpoints tested with proper HTTP methods and paths
- **Authentication & Authorization**: Testing for both USER and ADMINISTRATOR roles with proper access control
- **Request Validation**: Invalid requests properly return 400 Bad Request with validation details
- **Error Handling**: Service errors are properly handled and return appropriate HTTP status codes
- **URL Encoding**: Base64 encoding for virtual hosts and URL encoding for resource names
- **Edge Cases**: Special characters in resource names, empty routing keys, large payloads
- **Path Variables**: Proper handling of cluster IDs, virtual hosts, and resource names in URLs

### End-to-End Testing

The API includes comprehensive end-to-end testing through `RabbitMQWriteOperationsEndToEndTest` which validates:

- **Complete Workflow Testing**: Full lifecycle validation for both exchanges and queues
  - **Exchange Lifecycle**: create → bind → publish → delete workflow validation
  - **Queue Lifecycle**: create → publish → consume → purge → delete workflow validation
- **Security Model Compliance**: Authentication enforcement and role-based access control
- **Multi-Configuration Testing**: Different virtual hosts, exchange types, and cluster configurations
- **UI Consistency Validation**: Error response format consistency and URL encoding handling
- **Production Readiness**: Comprehensive validation of all implemented features working together

#### End-to-End Test Coverage

**Exchange Workflow Testing:**

- ✅ Exchange creation with proper validation and authentication
- ✅ Binding creation from exchange to queue with routing key configuration
- ✅ Message publishing to exchange with routing confirmation
- ✅ Exchange deletion with conditional parameters (if-unused)

**Queue Workflow Testing:**

- ✅ Queue creation with durability and configuration options
- ✅ Direct message publishing to queue via default exchange
- ✅ Message consumption with acknowledgment mode selection
- ✅ Queue purging to remove all messages
- ✅ Queue deletion with conditional parameters (if-empty, if-unused)

**Security Validation:**

- ✅ Authentication requirement enforcement for all write operations
- ✅ Role-based access control for both USER and ADMINISTRATOR roles
- ✅ Proper error responses for unauthorized access attempts

**Configuration Testing:**

- ✅ Different virtual host configurations (default "/" and custom vhosts)
- ✅ All exchange types (direct, fanout, topic, headers)
- ✅ URL encoding consistency for special characters in resource names
- ✅ Base64 encoding for virtual host path parameters

### Test Coverage by Operation

#### Virtual Host Operations

- ✅ Get virtual hosts with authentication
- ✅ Error handling for service failures
- ✅ Unauthorized access scenarios

#### Exchange Operations

- ✅ Create exchange with validation
- ✅ Delete exchange with conditional parameters
- ✅ Invalid request handling
- ✅ Service error scenarios

#### Queue Operations

- ✅ Create queue with full configuration
- ✅ Delete queue with if-empty and if-unused conditions
- ✅ Purge queue operations
- ✅ Validation error handling

#### Binding Operations

- ✅ Create exchange-to-queue bindings
- ✅ Create exchange-to-exchange bindings
- ✅ Invalid Base64 virtual host handling
- ✅ Empty routing key support

#### Message Operations

- ✅ Publish to exchange with routing confirmation
- ✅ Publish directly to queue via default exchange
- ✅ Get messages with different acknowledgment modes
- ✅ Large payload handling
- ✅ Invalid payload validation

### Tested DTOs

- `CreateExchangeRequest` - Exchange creation with type and argument validation
- `CreateQueueRequest` - Queue creation with durability and configuration options
- `CreateBindingRequest` - Binding creation with routing key and argument handling
- `PublishMessageRequest` - Message publishing with payload size and encoding validation
- `GetMessagesRequest` - Message consumption with count and acknowledgment mode validation
- `VirtualHostDto` - Virtual host information with statistics
- `MessageDto` - Message representation with properties and metadata
- `PublishResponse` - Publishing result with routing confirmation

## TypeScript Interfaces

The frontend application includes comprehensive TypeScript interfaces for all RabbitMQ resource types. These interfaces provide type safety and IntelliSense support for developers working with the API responses.

### Core Types

```typescript
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  name?: string;
  useRegex?: boolean;
}
```

### Resource Types

```typescript
// Connection interface with comprehensive client and network information
export interface RabbitMQConnection {
  name: string;
  state: "running" | "blocked" | "blocking" | "closed";
  channels: number;
  client_properties: {
    connection_name?: string;
    platform?: string;
    product?: string;
    version?: string;
    [key: string]: any;
  };
  host: string;
  peer_host: string;
  port: number;
  peer_port: number;
  protocol: string;
  user: string;
  vhost: string;
  timeout: number;
  frame_max: number;
  recv_oct: number;
  recv_cnt: number;
  send_oct: number;
  send_cnt: number;
  connected_at: number;
}

// Channel interface with consumer and message statistics
export interface RabbitMQChannel {
  name: string;
  connection_details: {
    name: string;
    peer_host: string;
  };
  number: number;
  state: "running" | "flow" | "starting" | "closing";
  consumer_count: number;
  messages_unacknowledged: number;
  messages_unconfirmed: number;
  messages_uncommitted: number;
  acks_uncommitted: number;
  prefetch_count: number;
  global_prefetch_count: number;
  transactional: boolean;
  confirm: boolean;
  user: string;
  vhost: string;
  // Consumer details for channel detail modal
  consumer_details?: Array<{
    consumer_tag: string;
    queue: {
      name: string;
      vhost: string;
    };
    ack_required: boolean;
    prefetch_count: number;
    arguments: Record<string, any>;
  }>;
  // Message statistics for detailed channel information
  message_stats?: {
    ack: number;
    ack_details: { rate: number };
    deliver: number;
    deliver_details: { rate: number };
    deliver_get: number;
    deliver_get_details: { rate: number };
    deliver_no_ack: number;
    deliver_no_ack_details: { rate: number };
    get: number;
    get_details: { rate: number };
    get_no_ack: number;
    get_no_ack_details: { rate: number };
    publish: number;
    publish_details: { rate: number };
    redeliver: number;
    redeliver_details: { rate: number };
  };
  // Computed properties for enhanced UI display
  totalUnacknowledged?: number; // Sum of unacknowledged + unconfirmed + uncommitted
  hasTransactions?: string; // "Yes" | "No" for display
  hasConfirms?: string; // "Yes" | "No" for display
  connectionName?: string; // Formatted connection name
  connectionHost?: string; // Formatted connection host
}

// Exchange interface with message statistics
export interface RabbitMQExchange {
  name: string;
  type: "direct" | "fanout" | "topic" | "headers";
  durable: boolean;
  auto_delete: boolean;
  internal: boolean;
  arguments: Record<string, any>;
  vhost: string;
  message_stats?: {
    publish_in: number;
    publish_in_details: { rate: number };
    publish_out: number;
    publish_out_details: { rate: number };
  };
}

// Queue interface with comprehensive statistics and consumer details
export interface RabbitMQQueue {
  name: string;
  state: "running" | "idle" | "flow" | "down";
  durable: boolean;
  auto_delete: boolean;
  exclusive: boolean;
  arguments: Record<string, any>;
  node: string;
  vhost: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
  consumer_utilisation?: number;
  memory: number;
  message_stats?: {
    deliver_get: number;
    deliver_get_details: { rate: number };
    publish: number;
    publish_details: { rate: number };
  };
  consumer_details?: Array<{
    consumer_tag: string;
    channel_details: {
      name: string;
      connection_name: string;
      peer_host: string;
    };
    ack_required: boolean;
    prefetch_count: number;
  }>;
}

// Binding interface for exchange and queue relationships
export interface RabbitMQBinding {
  source: string;
  destination: string;
  destination_type: "queue" | "exchange";
  routing_key: string;
  arguments: Record<string, any>;
  properties_key: string;
  vhost: string;
}
```

### Utility Types

```typescript
// Filter configuration for resource browsing
export interface ResourceFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  stateFilter: string[];
  typeFilter: string[];
}

// Error handling for resource operations
export interface ResourceError {
  type:
    | "network"
    | "authentication"
    | "authorization"
    | "cluster_unavailable"
    | "api_error";
  message: string;
  details?: string;
  retryable: boolean;
  timestamp: number;
}
```

## Endpoints

### Get Connections

Retrieves a paginated list of RabbitMQ connections.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/resources/connections`

**Response Example:**

```json
{
  "items": [
    {
      "name": "connection-1",
      "state": "running",
      "channels": 2,
      "clientProperties": {
        "connection_name": "MyApp Connection",
        "platform": "Java",
        "product": "RabbitMQ Java Client",
        "version": "5.16.0"
      },
      "host": "localhost",
      "peerHost": "192.168.1.100",
      "port": 5672,
      "peerPort": 54321,
      "protocol": "AMQP 0-9-1",
      "user": "guest",
      "vhost": "/",
      "connectedAt": 1640995200000
    }
  ],
  "page": 0,
  "pageSize": 50,
  "totalItems": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false
}
```

### Get Channels

Retrieves a paginated list of RabbitMQ channels.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/resources/channels`

**Response Example:**

```json
{
  "items": [
    {
      "name": "channel-1",
      "number": 1,
      "state": "running",
      "consumer_count": 2,
      "messages_unacknowledged": 0,
      "messages_unconfirmed": 0,
      "messages_uncommitted": 0,
      "prefetch_count": 100,
      "global_prefetch_count": 0,
      "transactional": false,
      "confirm": false,
      "user": "guest",
      "vhost": "/",
      "connection_details": {
        "name": "connection-1",
        "peer_host": "192.168.1.100"
      },
      "consumer_details": [
        {
          "consumer_tag": "amq.ctag-abc123",
          "queue": {
            "name": "test-queue",
            "vhost": "/"
          },
          "ack_required": true,
          "prefetch_count": 10,
          "arguments": {}
        }
      ],
      "message_stats": {
        "ack": 150,
        "ack_details": { "rate": 2.5 },
        "deliver": 200,
        "deliver_details": { "rate": 3.2 },
        "deliver_get": 180,
        "deliver_get_details": { "rate": 2.8 },
        "deliver_no_ack": 20,
        "deliver_no_ack_details": { "rate": 0.4 },
        "get": 50,
        "get_details": { "rate": 0.8 },
        "get_no_ack": 10,
        "get_no_ack_details": { "rate": 0.2 },
        "publish": 220,
        "publish_details": { "rate": 3.5 },
        "redeliver": 5,
        "redeliver_details": { "rate": 0.1 }
      }
    }
  ],
  "page": 0,
  "pageSize": 50,
  "totalItems": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false
}
```

### Get Exchanges

Retrieves a paginated list of RabbitMQ exchanges.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/resources/exchanges`

**Response Example:**

```json
{
  "items": [
    {
      "name": "test-exchange",
      "type": "direct",
      "durable": true,
      "autoDelete": false,
      "internal": false,
      "arguments": {},
      "vhost": "/"
    }
  ],
  "page": 0,
  "pageSize": 50,
  "totalItems": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false
}
```

### Get Queues

Retrieves a paginated list of RabbitMQ queues.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/resources/queues`

**Response Example:**

```json
{
  "items": [
    {
      "name": "test-queue",
      "state": "running",
      "durable": true,
      "autoDelete": false,
      "exclusive": false,
      "arguments": {},
      "node": "rabbit@localhost",
      "vhost": "/",
      "messages": 10,
      "messagesReady": 8,
      "messagesUnacknowledged": 2,
      "consumers": 1
    }
  ],
  "page": 0,
  "pageSize": 50,
  "totalItems": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false
}
```

### Get Exchange Bindings

Retrieves all bindings for a specific exchange.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{exchangeName}/bindings`

**Parameters:**

- `vhost`: The virtual host name (Base64 encoded)
- `exchangeName`: The name of the exchange (URL encoded)

**Note**: Virtual host names are Base64 encoded to handle special characters like `/` (default vhost). Resource names (exchanges, queues) are URL encoded using standard percent-encoding.

**Response Example:**

```json
[
  {
    "source": "test-exchange",
    "destination": "test-queue",
    "destinationType": "queue",
    "routingKey": "test.routing.key",
    "arguments": {},
    "vhost": "/"
  },
  {
    "source": "test-exchange",
    "destination": "another-exchange",
    "destinationType": "exchange",
    "routingKey": "*.important.*",
    "arguments": {
      "x-match": "all"
    },
    "vhost": "/"
  }
]
```

### Get Queue Bindings

Retrieves all bindings for a specific queue.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queueName}/bindings`

**Parameters:**

- `vhost`: The virtual host name (Base64 encoded)
- `queueName`: The name of the queue (URL encoded)

**Note**: Virtual host names are Base64 encoded to handle special characters like `/` (default vhost). Resource names (exchanges, queues) are URL encoded using standard percent-encoding.

**Response Example:**

```json
[
  {
    "source": "test-exchange",
    "destination": "test-queue",
    "destinationType": "queue",
    "routingKey": "test.routing.key",
    "arguments": {},
    "vhost": "/"
  },
  {
    "source": "direct-exchange",
    "destination": "test-queue",
    "destinationType": "queue",
    "routingKey": "direct.key",
    "arguments": {},
    "vhost": "/"
  }
]
```

## Write Operations

The API supports write operations for managing RabbitMQ resources. These operations extend the read-only functionality to provide comprehensive resource management capabilities.

**Implementation Status:**

- ✅ **Virtual Host Management**: Get virtual hosts with comprehensive metadata
- ✅ **Exchange Management**: Create and delete exchanges with full validation and conditional deletion
- ✅ **Queue Management**: Create, delete, and purge queues with conditional options (if-empty, if-unused)
- ✅ **Binding Management**: Create bindings between exchanges and queues/exchanges with full argument support
- ✅ **Message Publishing**: Publish messages to exchanges and queues with routing confirmation and comprehensive properties
- ⚠️ **Message Consumption**: Service layer implemented, controller endpoint pending (task 7 in implementation plan)

**Backend Implementation Complete**: All write operations are fully implemented in the backend with comprehensive validation, error handling, audit logging, and metrics collection. The implementation includes proper URL encoding/decoding for virtual hosts and resource names, support for complex arguments and properties, and integration with the existing security model.

**Frontend Implementation Status**: The backend API is ready for frontend integration. Frontend components for write operations are progressively being implemented with comprehensive notification system integration:

- ✅ **Exchange Creation Dialog**: Fully implemented CreateExchangeDialog component with comprehensive form validation, exchange type selection, virtual host integration, arguments editor, and complete test coverage
- ✅ **Queue Creation Dialog**: Fully implemented CreateQueueDialog component with comprehensive form validation, queue options, virtual host integration, arguments editor, and complete test coverage
- ✅ **Binding Creation Dialog**: Fully implemented CreateBindingDialog component with dual context support (exchange/queue), destination type selection, routing key validation, arguments editor, and comprehensive error handling
- ✅ **Message Publishing Dialog**: Fully implemented PublishMessageDialog component with comprehensive form validation, dual context support (exchange/queue), payload encoding options, message properties and headers editors, routing confirmation feedback, and complete test coverage including form validation, API integration, error handling, and notification testing
- ✅ **Message Consumption Dialog**: Fully implemented GetMessagesDialog and MessageDisplayDialog components with acknowledgment modes, message count selection, encoding options, and comprehensive validation
- ✅ **Delete Confirmation Dialog**: Fully implemented DeleteConfirmationDialog component with multi-context support, conditional deletion options, and comprehensive example integration patterns
- 🚧 **UI Integration**: ExchangesList component integration in progress with action menus for write operations (create binding, publish message, delete exchange) and proper dialog state management
- ✅ **Notification System**: Comprehensive notification utilities implemented with consistent message formatting, HTTP status code handling, routing result notifications, and automatic duration management

The current frontend provides full read-only access to all RabbitMQ resources with advanced filtering, pagination, and detailed views, plus comprehensive write operation dialogs ready for integration with a complete notification system for user feedback.

**Validation and Testing**: All implemented write operation DTOs include comprehensive validation constraints and have been thoroughly tested for:

- JSON serialization and deserialization
- Validation constraint enforcement
- Null value handling in constructors and setters
- Complex nested object handling in arguments and properties
- Edge cases and error conditions

### Virtual Host Management

#### Get Virtual Hosts

Retrieves a list of available virtual hosts for the cluster. This endpoint is used by write operation forms to populate virtual host dropdowns.

**Endpoint:** `GET /api/rabbitmq/{clusterId}/vhosts`

**Note:** This endpoint is part of the main RabbitMQ API controller (`/api/rabbitmq/{clusterId}/`), not the resource management controller (`/api/rabbitmq/{clusterId}/resources/`). Virtual hosts are cluster-level metadata and are accessed directly from the cluster API.

**Response Example:**

```json
[
  {
    "name": "/",
    "description": "Default virtual host",
    "tags": "",
    "defaultQueueType": "classic",
    "tracing": false
  },
  {
    "name": "production",
    "description": "Production environment",
    "tags": "production",
    "defaultQueueType": "quorum",
    "tracing": true
  }
]
```

**Response Schema:**

| Field              | Type    | Description                              |
| ------------------ | ------- | ---------------------------------------- |
| `name`             | string  | Virtual host name                        |
| `description`      | string  | Virtual host description                 |
| `tags`             | string  | Comma-separated list of tags             |
| `defaultQueueType` | string  | Default queue type for this virtual host |
| `tracing`          | boolean | Whether message tracing is enabled       |

### Exchange Management

#### Create Exchange

Creates a new RabbitMQ exchange.

**Endpoint:** `PUT /api/rabbitmq/{clusterId}/resources/exchanges`

**Request Body:**

```json
{
  "name": "my-exchange",
  "type": "direct",
  "vhost": "/",
  "durable": true,
  "autoDelete": false,
  "internal": false,
  "arguments": {
    "x-message-ttl": 60000
  }
}
```

**Request Body Schema:**

| Field        | Type    | Required | Description                                                                |
| ------------ | ------- | -------- | -------------------------------------------------------------------------- |
| `name`       | string  | Yes      | Exchange name (1-255 characters, alphanumeric, dots, underscores, hyphens) |
| `type`       | string  | Yes      | Exchange type: `direct`, `fanout`, `topic`, or `headers`                   |
| `vhost`      | string  | Yes      | Virtual host name                                                          |
| `durable`    | boolean | No       | Whether the exchange survives server restarts (default: true)              |
| `autoDelete` | boolean | No       | Whether the exchange is deleted when no longer used (default: false)       |
| `internal`   | boolean | No       | Whether the exchange is internal (default: false)                          |
| `arguments`  | object  | No       | Additional exchange arguments                                              |

**Response:** `204 No Content` on success

#### Delete Exchange

Deletes an existing RabbitMQ exchange.

**Endpoint:** `DELETE /api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{name}`

**Query Parameters:**

| Parameter   | Type    | Required | Description                             |
| ----------- | ------- | -------- | --------------------------------------- |
| `if-unused` | boolean | No       | Only delete if exchange has no bindings |

**Response:** `204 No Content` on success

### Queue Management

#### Create Queue

Creates a new RabbitMQ queue.

**Endpoint:** `PUT /api/rabbitmq/{clusterId}/resources/queues`

**Request Body:**

```json
{
  "name": "my-queue",
  "vhost": "/",
  "durable": true,
  "autoDelete": false,
  "exclusive": false,
  "arguments": {
    "x-message-ttl": 300000,
    "x-max-length": 1000
  },
  "node": "rabbit@server1"
}
```

**Request Body Schema:**

| Field        | Type    | Required | Description                                                       |
| ------------ | ------- | -------- | ----------------------------------------------------------------- |
| `name`       | string  | Yes      | Queue name (1-255 characters)                                     |
| `vhost`      | string  | Yes      | Virtual host name                                                 |
| `durable`    | boolean | No       | Whether the queue survives server restarts (default: true)        |
| `autoDelete` | boolean | No       | Whether the queue is deleted when no longer used (default: false) |
| `exclusive`  | boolean | No       | Whether the queue is exclusive to one connection (default: false) |
| `arguments`  | object  | No       | Additional queue arguments                                        |
| `node`       | string  | No       | Specific node to create the queue on                              |

**Response:** `204 No Content` on success

#### Delete Queue

Deletes an existing RabbitMQ queue.

**Endpoint:** `DELETE /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}`

**Query Parameters:**

| Parameter   | Type    | Required | Description                           |
| ----------- | ------- | -------- | ------------------------------------- |
| `if-empty`  | boolean | No       | Only delete if queue has no messages  |
| `if-unused` | boolean | No       | Only delete if queue has no consumers |

**Response:** `204 No Content` on success

#### Purge Queue

Removes all messages from a queue.

**Endpoint:** `DELETE /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}/contents`

**Response:** `204 No Content` on success

### Binding Management

#### Create Binding

Creates a binding between an exchange and a queue or another exchange.

**Endpoint:** `POST /api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/{destinationType}/{destination}`

**Path Parameters:**

| Parameter         | Description                                       |
| ----------------- | ------------------------------------------------- |
| `vhost`           | Virtual host name (Base64 encoded)                |
| `source`          | Source exchange name (URL encoded)                |
| `destinationType` | Destination type: `q` for queue, `e` for exchange |
| `destination`     | Destination queue or exchange name (URL encoded)  |

**Request Body:**

```json
{
  "routingKey": "user.created",
  "arguments": {
    "x-match": "all",
    "format": "json"
  }
}
```

**Request Body Schema:**

| Field        | Type   | Required | Description                                         |
| ------------ | ------ | -------- | --------------------------------------------------- |
| `routingKey` | string | No       | Routing key for the binding (default: empty string) |
| `arguments`  | object | No       | Binding arguments                                   |

**Response:** `201 Created` on success

#### Delete Binding

**Note:** Binding deletion functionality is not implemented in the current version. Only binding creation is currently supported. This is an intentional design decision to focus on the most commonly used operations. Users can manage binding deletion through the native RabbitMQ Management UI if needed.

**Future Enhancement**: Binding deletion may be added in a future release based on user feedback and requirements.

### Message Operations

#### Publish Message

Publishes a message to an exchange.

**Endpoint:** `POST /api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{exchange}/publish`

**Request Body:**

```json
{
  "routingKey": "user.created",
  "properties": {
    "delivery_mode": 2,
    "priority": 5,
    "content_type": "application/json",
    "headers": {
      "source": "user-service",
      "version": "1.0"
    }
  },
  "payload": "{\"userId\": 123, \"email\": \"user@example.com\"}",
  "payloadEncoding": "string"
}
```

**Request Body Schema:**

| Field             | Type   | Required | Description                                              |
| ----------------- | ------ | -------- | -------------------------------------------------------- |
| `routingKey`      | string | No       | Message routing key                                      |
| `properties`      | object | No       | Message properties (delivery_mode, priority, etc.)       |
| `payload`         | string | Yes      | Message payload                                          |
| `payloadEncoding` | string | No       | Payload encoding: `string` or `base64` (default: string) |

**Response:**

```json
{
  "routed": true,
  "message": "Message published successfully"
}
```

#### Publish Message to Queue

Publishes a message directly to a queue using the default exchange.

**Endpoint:** `POST /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}/publish`

**Request Body:** Same as exchange publishing

**Response:** Same as exchange publishing

**Note:** This endpoint publishes directly to a queue by using the default exchange with the queue name as the routing key.

#### Get Messages (Service Implementation Complete)

**Note:** Message consumption functionality has been implemented at the service layer but the controller endpoint is not yet available. The service method supports full message retrieval functionality and will be exposed via REST API in a future release.

**Planned Endpoint:** `POST /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{name}/get`

**Implementation Status:**

- ✅ **Service Layer**: `RabbitMQResourceService.getMessages()` method fully implemented
- ✅ **DTO Support**: `GetMessagesRequest` and `MessageDto` with comprehensive validation
- ✅ **Features**: Support for acknowledgment modes, encoding options, and message truncation
- ⚠️ **Controller Endpoint**: Not yet implemented - planned for next development phase
- ⚠️ **Frontend Integration**: Pending controller endpoint completion

**Implemented Features:**

- Retrieve messages from queues with different acknowledgment modes (`ack_requeue_true`, `ack_requeue_false`, `reject_requeue_true`, `reject_requeue_false`)
- Support for message encoding options (`auto`, `base64`)
- Configurable message count retrieval (1-1000 messages)
- Optional message truncation for large payloads
- Comprehensive audit logging and metrics collection
- Proper error handling and response parsing

## Error Responses

### 400 Bad Request

Invalid pagination parameters or malformed request.

```json
{
  "error": "Bad Request",
  "message": "Page must be at least 0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 401 Unauthorized

Missing or invalid JWT token.

```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 403 Forbidden

User does not have access to the specified cluster.

```json
{
  "error": "Forbidden",
  "message": "Access denied to cluster",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 404 Not Found

Cluster connection not found.

```json
{
  "error": "Not Found",
  "message": "Cluster connection not found",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 500 Internal Server Error

RabbitMQ cluster unavailable or other server error.

```json
{
  "error": "Internal Server Error",
  "message": "RabbitMQ cluster unavailable",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Frontend UI Enhancements

### Navigation Integration

The resource management features are fully integrated into the application's navigation system:

- **Collapsible Resource Menu**: The sidebar includes an expandable "Resources" section with dedicated sub-items
- **Cluster Access Validation**: Menu items are automatically disabled when users don't have access to any clusters
- **Visual State Management**: Active states are properly highlighted for both parent and child navigation items
- **Material UI Icons**: Each resource type has a dedicated icon (Router for Connections, AccountTree for Channels, Transform for Exchanges, Inbox for Queues)
- **Responsive Behavior**: Navigation adapts to different screen sizes and provides proper mobile support
- **External Management UI Access**: Users can access the native RabbitMQ Management UI directly using cluster URLs for full administrative capabilities

### Error Handling and Recovery

The resource management components include enhanced error handling capabilities:

- **ResourceErrorBoundary**: Comprehensive error boundary with automatic recovery
  - Automatically resets error state when navigating between resources or clusters
  - Enhanced with `getDerivedStateFromProps` for improved error recovery
  - Context-aware error messages with actionable suggestions
  - Detailed error logging with cluster and resource type context
  - Retry functionality with graceful error state management

### Resource Component Features

The channels list component includes several enhanced features for better user experience:

### Visual State Indicators

- **State Icons**: Each channel displays an appropriate icon based on its state:
  - ✅ Running: Green checkmark
  - ⚠️ Flow: Yellow warning
  - ▶️ Starting: Blue play arrow
  - ❌ Closing: Red error icon

### Enhanced Data Display

- **Tooltips**: Hover over data fields for detailed information:
  - Unacknowledged messages show breakdown of unacknowledged, unconfirmed, and uncommitted
  - Prefetch counts show both local and global prefetch values
- **Chips**: Visual indicators for boolean properties:
  - Transactional mode displayed as colored chips
  - Confirm mode displayed as colored chips

### Filtering and Search

- **State Filtering**: Filter channels by their current state (running, flow, starting, closing)
- **Name Search**: Search channels by name with optional regex support
- **Real-time Updates**: Auto-refresh functionality with configurable intervals (note: some timer-based tests are currently skipped due to CI reliability)

### Connection Information

- **Connection Details**: Each channel shows its associated connection name and host
- **Network Information**: Display peer host information for connection tracking

### Channel Detail Modal

The channel detail modal provides comprehensive information about individual channels:

- **Consumer Details**: View all consumers attached to the channel, including:
  - Consumer tags and associated queues
  - Acknowledgment requirements and prefetch counts
  - Consumer-specific arguments and configuration
- **Message Statistics**: Detailed message flow statistics including:
  - Acknowledgment rates and totals
  - Delivery statistics (with and without acknowledgment)
  - Publish and redeliver rates
  - Get operations (basic.get) statistics
- **Channel Configuration**: Display of channel-specific settings:
  - Prefetch counts (local and global)
  - Transaction and confirmation modes
  - User and virtual host information

## Usage Examples

### Basic Usage

```bash
# Get first page of connections
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/connections"

# Get second page with custom page size
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/connections?page=1&pageSize=25"

# Filter connections by name
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/connections?name=myapp"

# Use regex filtering
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/connections?name=^myapp.*&useRegex=true"

# Get all channels for a specific connection
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/channels?name=connection-1"

# Get exchanges of a specific type
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges?name=.*&useRegex=true" \
  | jq '.items[] | select(.type == "topic")'

# Get queues with messages
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues" \
  | jq '.items[] | select(.messages > 0)'

# Get bindings for a specific exchange (using default vhost "/")
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges/%2F/my-exchange/bindings"

# Get bindings for a specific queue (using default vhost "/")
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues/%2F/my-queue/bindings"

# Get bindings for exchange in custom vhost
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges/production/my-exchange/bindings"

# Get virtual hosts for a cluster
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/vhosts"

# Create a new exchange
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-exchange","type":"direct","vhost":"/","durable":true}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges"

# Create a new queue
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-queue","vhost":"/","durable":true,"autoDelete":false}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues"

# Create a binding from exchange to queue
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"routingKey":"user.created","arguments":{}}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/bindings/%2F/e/my-exchange/q/my-queue"

# Create a binding from exchange to exchange
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"routingKey":"*.important.*","arguments":{"x-match":"all"}}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/bindings/%2F/e/source-exchange/e/dest-exchange"

# Note: Binding deletion is not currently supported via API
# Use the native RabbitMQ Management UI for binding deletion if needed

# Publish a message to an exchange
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"routingKey":"user.created","payload":"Hello World","payloadEncoding":"string"}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges/%2F/my-exchange/publish"

# Delete an exchange
curl -X DELETE -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges/%2F/my-exchange"

# Delete a queue
curl -X DELETE -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues/%2F/my-queue"

# Purge a queue
curl -X DELETE -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues/%2F/my-queue/contents"e":true}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges"

# Create a new queue
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-queue","vhost":"/","durable":true,"autoDelete":false}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues"

# Create a binding between exchange and queue
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"routingKey":"user.created","arguments":{}}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/bindings/%2F/e/my-exchange/q/my-queue"

# Publish a message to an exchange
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"routingKey":"user.created","payload":"Hello World","payloadEncoding":"string"}' \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges/%2F/my-exchange/publish"
```

### Advanced Filtering Examples

```bash
# Find connections from specific client applications
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/connections" \
  | jq '.items[] | select(.client_properties.product == "RabbitMQ Java Client")'

# Find channels with high unacknowledged message counts
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/channels" \
  | jq '.items[] | select(.messages_unacknowledged > 100)'

# Find durable exchanges
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/exchanges" \
  | jq '.items[] | select(.durable == true)'

# Find queues with consumers
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/rabbitmq/123e4567-e89b-12d3-a456-426614174000/resources/queues" \
  | jq '.items[] | select(.consumers > 0)'
```

### JavaScript/TypeScript Usage

```typescript
const token = localStorage.getItem("jwt-token");
const clusterId = "123e4567-e89b-12d3-a456-426614174000";

// Basic resource fetching
async function fetchConnections(page = 0, pageSize = 50) {
  const response = await fetch(
    `/api/rabbitmq/${clusterId}/resources/connections?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Found ${data.totalItems} connections`);
  return data;
}

// Fetch with filtering
async function fetchFilteredQueues(nameFilter: string, useRegex = false) {
  const params = new URLSearchParams({
    name: nameFilter,
    useRegex: useRegex.toString(),
    pageSize: "100",
  });

  const response = await fetch(
    `/api/rabbitmq/${clusterId}/resources/queues?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
}

// Fetch all pages of data
async function fetchAllConnections(): Promise<RabbitMQConnection[]> {
  const allConnections: RabbitMQConnection[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchConnections(page, 100);
    allConnections.push(...response.items);
    hasMore = response.hasNext;
    page++;
  }

  return allConnections;
}

// Fetch bindings for exchange or queue
async function fetchExchangeBindings(
  clusterId: string,
  vhost: string,
  exchangeName: string
) {
  const encodedVhost = encodeURIComponent(vhost);
  const encodedExchangeName = encodeURIComponent(exchangeName);

  const response = await fetch(
    `/api/rabbitmq/${clusterId}/resources/exchanges/${encodedVhost}/${encodedExchangeName}/bindings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function fetchQueueBindings(
  clusterId: string,
  vhost: string,
  queueName: string
) {
  const encodedVhost = encodeURIComponent(vhost);
  const encodedQueueName = encodeURIComponent(queueName);

  const response = await fetch(
    `/api/rabbitmq/${clusterId}/resources/queues/${encodedVhost}/${encodedQueueName}/bindings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Error handling example
async function safeResourceFetch(
  resourceType: string,
  params: Record<string, string> = {}
) {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(
      `/api/rabbitmq/${clusterId}/resources/${resourceType}?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 401) {
      // Handle authentication error
      console.error("Authentication required - redirecting to login");
      window.location.href = "/login";
      return null;
    }

    if (response.status === 403) {
      // Handle authorization error
      console.error("Access denied to cluster");
      throw new Error("You do not have permission to access this cluster");
    }

    if (response.status === 404) {
      // Handle not found error
      console.error("Cluster not found");
      throw new Error("The specified cluster was not found");
    }

    if (response.status >= 500) {
      // Handle server errors
      console.error("Server error - cluster may be unavailable");
      throw new Error("RabbitMQ cluster is currently unavailable");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Resource fetch error:", error);
    throw error;
  }
}

// React hook example
import { useState, useEffect, useCallback } from "react";

function useRabbitMQResource<T>(
  resourceType: string,
  clusterId: string,
  params: Record<string, string> = {}
) {
  const [data, setData] = useState<PagedResponse<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await safeResourceFetch(resourceType, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [resourceType, clusterId, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage of the custom hook
function ConnectionsList({ clusterId }: { clusterId: string }) {
  const { data, loading, error, refetch } =
    useRabbitMQResource<RabbitMQConnection>("connections", clusterId, {
      pageSize: "50",
    });

  if (loading) return <div>Loading connections...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <h2>Connections ({data.totalItems})</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data.items.map((connection) => (
          <li key={connection.name}>
            {connection.name} - {connection.state} ({connection.channels}{" "}
            channels)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Python Usage Examples

```python
import requests
import json
from typing import Dict, List, Optional

class RabbitMQResourceClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_resources(self, cluster_id: str, resource_type: str,
                     page: int = 0, page_size: int = 50,
                     name_filter: Optional[str] = None,
                     use_regex: bool = False) -> Dict:
        """Fetch resources with pagination and filtering."""
        params = {
            'page': page,
            'pageSize': page_size
        }

        if name_filter:
            params['name'] = name_filter
            params['useRegex'] = use_regex

        url = f"{self.base_url}/api/rabbitmq/{cluster_id}/resources/{resource_type}"
        response = requests.get(url, headers=self.headers, params=params)

        if response.status_code == 401:
            raise Exception("Authentication required")
        elif response.status_code == 403:
            raise Exception("Access denied to cluster")
        elif response.status_code == 404:
            raise Exception("Cluster not found")
        elif response.status_code >= 500:
            raise Exception("RabbitMQ cluster unavailable")

        response.raise_for_status()
        return response.json()

    def get_all_resources(self, cluster_id: str, resource_type: str,
                         name_filter: Optional[str] = None) -> List[Dict]:
        """Fetch all resources across all pages."""
        all_items = []
        page = 0

        while True:
            data = self.get_resources(cluster_id, resource_type, page, 100, name_filter)
            all_items.extend(data['items'])

            if not data['hasNext']:
                break
            page += 1

        return all_items

    def get_bindings(self, cluster_id: str, resource_type: str, vhost: str, resource_name: str) -> List[Dict]:
        """Get bindings for a specific exchange or queue."""
        from urllib.parse import quote
        encoded_vhost = quote(vhost, safe='')
        encoded_resource_name = quote(resource_name, safe='')
        url = f"{self.base_url}/api/rabbitmq/{cluster_id}/resources/{resource_type}/{encoded_vhost}/{encoded_resource_name}/bindings"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

# Usage examples
client = RabbitMQResourceClient('http://localhost:8080', 'your-jwt-token')
cluster_id = '123e4567-e89b-12d3-a456-426614174000'

# Get connections
connections = client.get_resources(cluster_id, 'connections', page_size=25)
print(f"Found {connections['totalItems']} connections")

# Get all queues with messages
all_queues = client.get_all_resources(cluster_id, 'queues')
queues_with_messages = [q for q in all_queues if q['messages'] > 0]
print(f"Found {len(queues_with_messages)} queues with messages")

# Get bindings for an exchange (using default vhost)
bindings = client.get_bindings(cluster_id, 'exchanges', '/', 'my-exchange')
print(f"Exchange has {len(bindings)} bindings")

# Get bindings for a queue in a custom vhost
bindings = client.get_bindings(cluster_id, 'queues', 'production', 'my-queue')
print(f"Queue has {len(bindings)} bindings")

# Filter channels by connection
channels = client.get_resources(cluster_id, 'channels', name_filter='connection-1')
print(f"Connection has {len(channels['items'])} channels")
```

## Rate Limiting

API calls are subject to rate limiting to protect RabbitMQ clusters from excessive requests. If you encounter rate limiting errors (HTTP 429), implement exponential backoff in your client code.

## Security Considerations

- All endpoints require valid JWT authentication
- Users can only access clusters they have been assigned to
- Sensitive information in connection properties is filtered out
- All requests are logged for audit purposes

## Testing

The RabbitMQ Resource Management API and frontend components include comprehensive testing:

### Backend WebClient Testing

The backend includes enhanced WebClient testing capabilities for debugging RabbitMQ Management API connectivity issues:

- **`WebClientBindingsTest.java`**: Comprehensive test suite that mirrors the exact WebClient configuration used by `RabbitMQClientService`
- **`WebClientDebugTest.java`**: Debug test suite for detailed WebClient vs curl comparison and URL variation testing
- **`WebClientLiveTest.java`**: Live testing suite for immediate feedback when debugging connectivity with running RabbitMQ instances
- **`WebClientBindingsIntegrationTest.java`**: Integration test suite for testing against real RabbitMQ instances (requires `-Drabbitmq.available=true`)
- **`RabbitMQClientServiceFixTest.java`**: Test suite to verify the fix for WebClient URL encoding issues with RabbitMQ vhosts (especially `%2F` encoding)
- **Multiple Test Approaches**: Four distinct test methods validate different WebClient patterns:
  - Direct WebClient calls with proper type safety (`ParameterizedTypeReference<List<BindingDto>>`)
  - Raw String response testing for JSON parsing debugging
  - URI builder approach testing for encoded path handling
  - Overview endpoint testing for basic connectivity validation
- **Configuration Alignment**: Tests use identical headers, authentication, and codec settings as the production service
- **Enhanced Error Handling**: Comprehensive error logging with HTTP status codes and response body details
- **Timeout Management**: 10-second timeouts for reliable test execution
- **User-Agent Validation**: Tests the `RabbitMQ-Admin-Client/1.0` User-Agent header configuration

**Integration Testing Features:**

- **Real API Validation**: Tests against actual RabbitMQ Management API endpoints
- **Response Structure Validation**: Verifies actual API response format and content
- **Conditional Execution**: Only runs when RabbitMQ is available (system property controlled)
- **Test Data Requirements**: Requires specific test data setup (exchange, queue, binding)
- **Comprehensive Coverage**: Tests both resource-specific endpoints and general connectivity

**Running Integration Tests:**

```bash
# Start RabbitMQ with test data
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Run live tests for immediate feedback
mvn test -pl backend -Dtest=WebClientLiveTest

# Run debug tests for WebClient vs curl comparison
mvn test -pl backend -Dtest=WebClientDebugTest

# Run fix verification tests
mvn test -pl backend -Dtest=RabbitMQClientServiceFixTest

# Run integration tests
mvn test -pl backend -Dtest=WebClientBindingsIntegrationTest -Drabbitmq.available=true
```

### URL Encoding Fix

The `RabbitMQClientService` includes a fix for WebClient URL encoding issues with RabbitMQ vhosts. Previously, WebClient would double-encode URLs containing `%2F` (the encoded form of `/` for the default vhost), causing 404 errors while curl commands worked correctly.

**The Problem:**

- RabbitMQ Management API uses `/` as the default vhost name
- URLs must encode `/` as `%2F` in paths like `/api/exchanges/%2F/my-exchange`
- WebClient was double-encoding these URLs, turning `%2F` into `%252F`
- This caused 404 errors for resources in the default vhost

**The Solution:**
The `buildUri()` method in `RabbitMQClientService` now detects paths containing `%2F` and uses URI templates to avoid double-encoding:

```java
private java.net.URI buildUri(UriBuilder uriBuilder, String path) {
    if (path.contains("%2F")) {
        // Replace %2F with {vhost} and use URI template to avoid double encoding
        String templatePath = path.replace("%2F", "{vhost}");
        return uriBuilder.path(templatePath).build("/");
    } else {
        return uriBuilder.path(path).build();
    }
}
```

**Verification:**
The fix is verified by `RabbitMQClientServiceFixTest.java` which tests:

- Problematic paths that were failing before the fix
- URI builder logic for both vhost and non-vhost paths
- Comparison with curl behavior to ensure consistency

**Example Test Pattern:**

```java
@Test
public void testWebClientDirectCall() {
    // Create WebClient with same configuration as RabbitMQClientService
    WebClient client = WebClient.builder()
            .baseUrl("http://localhost:15672/")
            .defaultHeader(HttpHeaders.AUTHORIZATION, authHeader)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.USER_AGENT, "RabbitMQ-Admin-Client/1.0")
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
            .build();

    // Test with proper type safety and error handling
    Mono<List<BindingDto>> response = client.get()
            .uri("/api/exchanges/%2F/demo-ex/bindings/source")
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<List<BindingDto>>() {})
            .timeout(Duration.ofSeconds(10))
            .doOnError(WebClientResponseException.class, error -> {
                System.out.println("HTTP ERROR: " + error.getStatusCode());
                System.out.println("Response body: " + error.getResponseBodyAsString());
            });
}
```

### Frontend Component Testing

- **Advanced MUI DataGrid Mocking**: Custom mocks that preserve interaction testing while providing reliable test execution
- **Theme Provider Integration**: Proper Material-UI theme setup for component testing
- **Comprehensive Interaction Testing**: Full coverage of user interactions, modal behaviors, and state management
- **Clipboard API Mocking**: Testing of copy-to-clipboard functionality in detail modals
- **Async Operation Testing**: Proper handling of loading states, error conditions, and data fetching
- **ExchangesList Component Testing**: Complete test suite covering rendering, interactions, error handling, accessibility, and performance with large datasets
- **Modal Behavior Testing**: Comprehensive testing of detail modals including open/close interactions and data display
- **Search and Filtering Testing**: Full coverage of search functionality, filter clearing, and parameter validation
- **Accessibility Testing**: ARIA labels, keyboard navigation, and screen reader compatibility
- **Performance Testing**: Large dataset handling (1000+ items) and edge case validation

### Backend API Testing

- **Controller Tests**: Full coverage of all resource endpoints with authentication and authorization testing
- **Integration Tests**: Backend integration testing with real RabbitMQ clusters using TestContainers (part of CI/CD)
- **Reactive Testing**: Modern reactive testing patterns using `StepVerifier` for WebClient interactions and non-blocking test execution
- **Error Handling Tests**: Comprehensive testing of error scenarios and edge cases with reactive error operators
- **Pagination Testing**: Validation of pagination parameters and response formatting

For detailed testing documentation and patterns, see the [Frontend Testing Guide](../testing/frontend-testing-guide.md).

## Performance Optimization

### Client-Side Caching

The frontend implements intelligent caching to improve performance and reduce API calls:

#### Cache Configuration

- **Connections**: 30-second TTL (highly dynamic data)
- **Channels**: 30-second TTL (highly dynamic data)
- **Exchanges**: 5-minute TTL (less dynamic data)
- **Queues**: 1-minute TTL (moderately dynamic data)
- **Bindings**: 10-minute TTL (least dynamic data)

#### Cache Features

- **Automatic Cleanup**: Expired entries are automatically removed
- **Size Limits**: Configurable maximum cache size with LRU eviction
- **Cache Invalidation**: Manual invalidation by cluster and resource type
- **Statistics**: Built-in cache performance monitoring
- **Key Generation**: Intelligent cache key generation including pagination parameters

#### Cache Usage

The caching system is transparent to users but provides significant performance benefits:

- Reduces redundant API calls during navigation
- Improves response times for recently accessed data
- Preserves user experience during temporary network issues
- Optimizes resource usage on both client and server

```typescript
// Cache instances are automatically used by resource hooks
const connectionsCache = new ResourceCache({
  ttl: 30 * 1000, // 30 seconds
  maxSize: 50,
});

// Cache statistics available for monitoring
const stats = connectionsCache.getStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

#### Integration with Resource Hooks

The caching system integrates seamlessly with resource hooks. The `useConnections` hook has been enhanced to automatically leverage caching, with other hooks (`useChannels`, `useExchanges`, `useQueues`) following the same pattern:

```typescript
// Current implementation with enhanced type safety
export const useConnections = (options: UseConnectionsOptions = {}) => {
  const loadConnections = useCallback(
    async (clusterId: string, params: PaginationRequest = {}) => {
      // Check cache first with improved type validation
      const cachedData = connectionsCache.get(clusterId, "connections", params);
      if (
        cachedData &&
        typeof cachedData === "object" &&
        "items" in cachedData &&
        Array.isArray(cachedData.items)
      ) {
        setData(cachedData as PagedResponse<RabbitMQConnection>);
        return;
      }

      // Fetch from API and cache result
      const response = await rabbitmqResourcesApi.getConnections(
        clusterId,
        params
      );
      connectionsCache.set(clusterId, "connections", response, params);
      setData(response);
    },
    []
  );

  const refreshConnections = useCallback(async () => {
    // Invalidate cache on manual refresh
    if (lastParams) {
      connectionsCache.invalidate(lastParams.clusterId, "connections");
      await loadConnections(lastParams.clusterId, lastParams.params);
    }
  }, [lastParams, loadConnections]);
};
```

## Future Enhancements

The following features are planned for future releases:

- Real-time updates via WebSocket connections
- Advanced filtering and sorting options
- Resource creation and modification endpoints (currently read-only)
- Bulk operations for resource management
- Enhanced caching with stale-while-revalidate pattern
- Virtual scrolling for large datasets
