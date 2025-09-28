# Design Document

## Overview

This design document outlines the implementation of basic write operations for the RabbitMQ Admin application. The feature extends the existing read-only functionality to provide comprehensive management capabilities including creating, modifying, and deleting RabbitMQ resources (exchanges, queues, bindings) and performing message operations (publish, consume, purge).

The implementation follows the existing application architecture patterns, leveraging the RabbitMQ Management HTTP API for all operations while maintaining the current security model and UI consistency.

## Architecture

### Backend Architecture

The backend implementation extends the existing service and controller layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Controller Layer                             │
├─────────────────────────────────────────────────────────────────┤
│ RabbitMQResourceController (Extended)                           │
│ - New endpoints for write operations                            │
│ - Consistent validation and error handling                      │
│ - Same security patterns as existing endpoints                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                │
├─────────────────────────────────────────────────────────────────┤
│ RabbitMQResourceService (Extended)                              │
│ - Write operation methods                                       │
│ - Virtual host management                                       │
│ - Message operations                                            │
│ - Consistent audit and metrics logging                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Proxy Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│ RabbitMQProxyService (Existing)                                 │
│ - HTTP method support (PUT, POST, DELETE)                      │
│ - Request body handling for write operations                    │
│ - Same authentication and error handling                        │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

The frontend implementation extends the existing resource components:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Page Components                              │
├─────────────────────────────────────────────────────────────────┤
│ ExchangesPage / QueuesPage (Extended)                           │
│ - Action buttons for write operations                           │
│ - Modal dialogs for forms                                       │
│ - Consistent with existing UI patterns                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Form Components                              │
├─────────────────────────────────────────────────────────────────┤
│ CreateExchangeForm, CreateQueueForm, etc.                      │
│ - Material-UI form components                                   │
│ - Validation using existing patterns                            │
│ - Virtual host selection dropdowns                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer                                    │
├─────────────────────────────────────────────────────────────────┤
│ rabbitmqResourcesApi (Extended)                                 │
│ - Write operation API calls                                     │
│ - Request/response type definitions                             │
│ - Error handling and notifications                              │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### New DTOs

**CreateExchangeRequest**

```java
public class CreateExchangeRequest {
    private String name;
    private String type; // direct, fanout, topic, headers
    private String vhost;
    private Boolean durable = true;
    private Boolean autoDelete = false;
    private Boolean internal = false;
    private Map<String, Object> arguments = new HashMap<>();
}
```

**CreateQueueRequest**

```java
public class CreateQueueRequest {
    private String name;
    private String vhost;
    private Boolean durable = true;
    private Boolean autoDelete = false;
    private Boolean exclusive = false;
    private Map<String, Object> arguments = new HashMap<>();
    private String node; // optional
}
```

**CreateBindingRequest**

```java
public class CreateBindingRequest {
    private String routingKey;
    private Map<String, Object> arguments = new HashMap<>();
}
```

**PublishMessageRequest**

```java
public class PublishMessageRequest {
    private String routingKey;
    private Map<String, Object> properties = new HashMap<>();
    private String payload;
    private String payloadEncoding = "string"; // string or base64
}
```

**GetMessagesRequest**

```java
public class GetMessagesRequest {
    private Integer count = 1;
    private String ackmode = "ack_requeue_true"; // ack_requeue_true, ack_requeue_false, reject_requeue_true, reject_requeue_false
    private String encoding = "auto"; // auto or base64
    private Integer truncate; // optional
}
```

**MessageDto**

```java
public class MessageDto {
    private String payloadEncoding;
    private String payload;
    private Map<String, Object> properties;
    private String routingKey;
    private Boolean redelivered;
    private String exchange;
    private Integer messageCount;
}
```

**VirtualHostDto**

```java
public class VirtualHostDto {
    private String name;
    private String description;
    private String tags;
    private String defaultQueueType;
    private Boolean tracing;
    private Map<String, Object> messageStats;
}
```

#### Extended Service Methods

**RabbitMQResourceService** new methods:

- `getVirtualHosts(UUID clusterId, User user)` - List available virtual hosts
- `createExchange(UUID clusterId, CreateExchangeRequest request, User user)` - Create exchange
- `deleteExchange(UUID clusterId, String vhost, String name, Boolean ifUnused, User user)` - Delete exchange
- `createQueue(UUID clusterId, CreateQueueRequest request, User user)` - Create queue
- `deleteQueue(UUID clusterId, String vhost, String name, Boolean ifEmpty, Boolean ifUnused, User user)` - Delete queue
- `purgeQueue(UUID clusterId, String vhost, String name, User user)` - Purge queue messages
- `createBinding(UUID clusterId, String vhost, String source, String destination, String destinationType, CreateBindingRequest request, User user)` - Create binding
- `publishMessage(UUID clusterId, String vhost, String exchange, PublishMessageRequest request, User user)` - Publish message
- `getMessages(UUID clusterId, String vhost, String queue, GetMessagesRequest request, User user)` - Get messages from queue

#### Extended Controller Endpoints

**RabbitMQResourceController** new endpoints:

- `GET /api/rabbitmq/{clusterId}/vhosts` - List virtual hosts
- `PUT /api/rabbitmq/{clusterId}/exchanges` - Create exchange
- `DELETE /api/rabbitmq/{clusterId}/exchanges/{vhost}/{name}` - Delete exchange
- `PUT /api/rabbitmq/{clusterId}/queues` - Create queue
- `DELETE /api/rabbitmq/{clusterId}/queues/{vhost}/{name}` - Delete queue
- `DELETE /api/rabbitmq/{clusterId}/queues/{vhost}/{name}/contents` - Purge queue
- `POST /api/rabbitmq/{clusterId}/bindings/{vhost}/e/{source}/{destinationType}/{destination}` - Create binding
- `PUT /api/rabbitmq/{clusterId}/exchanges/{vhost}/{name}/publish` - Publish to exchange
- `POST /api/rabbitmq/{clusterId}/queues/{vhost}/{name}/get` - Get messages from queue

### Frontend Components

#### New Form Components

**CreateExchangeDialog**

- Exchange name input with validation
- Exchange type selection (direct, fanout, topic, headers)
- Virtual host dropdown
- Durability, auto-delete, internal checkboxes
- Arguments key-value editor
- Form validation and submission

**CreateQueueDialog**

- Queue name input with validation
- Virtual host dropdown
- Durability, auto-delete, exclusive checkboxes
- Arguments key-value editor
- Node selection (optional)
- Form validation and submission

**CreateBindingDialog**

- Destination input (queue/exchange name)
- Routing key input
- Arguments key-value editor
- Form validation and submission

**PublishMessageDialog**

- Routing key input
- Message properties editor (delivery mode, priority, etc.)
- Message headers key-value editor
- Payload textarea with encoding selection
- Form validation and submission

**GetMessagesDialog**

- Message count input (1-100)
- Acknowledgment mode selection
- Encoding preference selection
- Truncation limit input (optional)

**MessageDisplayDialog**

- Message list with expandable details
- Properties and headers display
- Payload display with proper encoding
- Redelivery status indicators

#### Extended Resource Components

**ExchangesList** enhancements:

- "Create Exchange" button
- Per-exchange action menu with:
  - "Create Binding"
  - "Publish Message"
  - "Delete Exchange"
- Integration with new dialog components

**QueuesList** enhancements:

- "Create Queue" button
- Per-queue action menu with:
  - "Create Binding"
  - "Publish Message"
  - "Get Messages"
  - "Purge Queue"
  - "Delete Queue"
- Integration with new dialog components

#### New API Functions

**rabbitmqResourcesApi** extensions:

```typescript
// Virtual hosts
export const getVirtualHosts = (clusterId: string): Promise<VirtualHost[]>

// Exchange operations
export const createExchange = (clusterId: string, request: CreateExchangeRequest): Promise<void>
export const deleteExchange = (clusterId: string, vhost: string, name: string, ifUnused?: boolean): Promise<void>

// Queue operations
export const createQueue = (clusterId: string, request: CreateQueueRequest): Promise<void>
export const deleteQueue = (clusterId: string, vhost: string, name: string, ifEmpty?: boolean, ifUnused?: boolean): Promise<void>
export const purgeQueue = (clusterId: string, vhost: string, name: string): Promise<void>

// Binding operations
export const createBinding = (clusterId: string, vhost: string, source: string, destination: string, destinationType: string, request: CreateBindingRequest): Promise<void>

// Message operations
export const publishMessage = (clusterId: string, vhost: string, exchange: string, request: PublishMessageRequest): Promise<PublishResponse>
export const getMessages = (clusterId: string, vhost: string, queue: string, request: GetMessagesRequest): Promise<Message[]>
```

## Data Models

### Request/Response Models

**Exchange Creation Flow:**

1. User selects "Create Exchange" → Opens CreateExchangeDialog
2. Form populated with virtual hosts from `getVirtualHosts()`
3. User submits → `createExchange()` API call
4. Success → Notification + refresh exchanges list
5. Error → Display error message

**Queue Creation Flow:**

1. User selects "Create Queue" → Opens CreateQueueDialog
2. Form populated with virtual hosts from `getVirtualHosts()`
3. User submits → `createQueue()` API call
4. Success → Notification + refresh queues list
5. Error → Display error message

**Binding Creation Flow:**

1. User selects resource → Opens CreateBindingDialog
2. User enters destination and routing key
3. User submits → `createBinding()` API call
4. Success → Notification + refresh bindings
5. Error → Display error message

**Message Publishing Flow:**

1. User selects "Publish Message" → Opens PublishMessageDialog
2. User enters message details
3. User submits → `publishMessage()` API call
4. Success → Show routing result notification
5. Error → Display error message

**Message Consumption Flow:**

1. User selects "Get Messages" → Opens GetMessagesDialog
2. User configures retrieval parameters
3. User submits → `getMessages()` API call
4. Success → Display messages in MessageDisplayDialog
5. Error → Display error message

### Virtual Host Handling

Virtual hosts are encoded for URL safety:

- Default vhost "/" becomes "%2F" in URLs
- Other vhosts are URL-encoded as needed
- Frontend uses Base64 encoding for path parameters
- Backend handles decoding consistently

### Message Encoding

Message payloads support multiple encodings:

- **String**: UTF-8 text (default for user input)
- **Base64**: Binary data or when UTF-8 is invalid
- **Auto**: Server determines best encoding for display

## Error Handling

### Backend Error Handling

**Validation Errors:**

- Invalid exchange/queue names
- Missing required fields
- Invalid virtual host references
- Malformed message payloads

**RabbitMQ API Errors:**

- Permission denied (403)
- Resource not found (404)
- Resource already exists (409)
- Precondition failed (412)
- Server errors (5xx)

**Error Response Format:**

```java
{
  "error": "validation_failed",
  "message": "Exchange name cannot be empty",
  "details": {
    "field": "name",
    "code": "required"
  }
}
```

### Frontend Error Handling

**Form Validation:**

- Real-time field validation
- Submit button disabled until valid
- Clear error messages per field

**API Error Display:**

- Toast notifications for operation results
- Detailed error messages in dialogs
- Retry mechanisms for transient failures

**Network Error Handling:**

- Connection timeout handling
- Authentication expiry detection
- Graceful degradation for offline scenarios

## Testing Strategy

### Backend Testing

**Unit Tests:**

- Service method validation logic
- DTO serialization/deserialization
- URL encoding/decoding utilities
- Error handling scenarios

**DTO Validation Testing:**

- **Comprehensive DTO Testing**: `DtoValidationComprehensiveTest` provides complete validation coverage for all write operation DTOs
- **Serialization/Deserialization**: JSON round-trip testing for all request and response DTOs
- **Validation Constraints**: Jakarta validation annotation enforcement testing
- **Null Safety**: Constructor and setter null handling with appropriate defaults
- **Complex Data Handling**: Nested objects and complex arguments processing
- **Edge Case Validation**: Invalid data triggers appropriate validation errors
- **Type Safety**: Proper handling of different data types in arguments and properties

**Integration Tests:**

- Controller endpoint functionality
- RabbitMQ API integration
- Authentication and authorization
- Error response handling

**Test Coverage Focus:**

- Critical path operations (create, delete)
- Edge cases (special characters, large payloads)
- Security scenarios (unauthorized access)
- Error conditions (invalid inputs, API failures)
- DTO validation and serialization reliability

### Frontend Testing

**Component Tests:**

- Form validation behavior
- Dialog open/close functionality
- API integration with mocked responses
- Error state rendering

**Integration Tests:**

- End-to-end operation flows
- Virtual host selection functionality
- Message display formatting
- Notification system integration

**User Experience Tests:**

- Form usability and validation
- Loading state indicators
- Error message clarity
- Responsive design compliance

### API Testing

**RabbitMQ Management API:**

- Verify all required endpoints are available
- Test with different RabbitMQ versions
- Validate request/response formats
- Test permission scenarios

**Compatibility Testing:**

- Different cluster configurations
- Various virtual host setups
- Exchange and queue type variations
- Message encoding scenarios

## Security Considerations

### Authentication and Authorization

**Existing Security Model:**

- JWT-based authentication maintained
- Cluster access permissions enforced
- User role validation (USER/ADMINISTRATOR)
- Session management unchanged

**Write Operation Security:**

- Same authentication requirements as read operations
- Cluster-level permission validation
- RabbitMQ server-side permission enforcement
- Audit logging for all write operations

### Input Validation

**Backend Validation:**

- Exchange/queue name format validation
- Virtual host existence verification
- Message payload size limits
- Routing key format validation

**Frontend Validation:**

- Client-side input sanitization
- XSS prevention in message display
- CSRF protection for form submissions
- Input length and format restrictions

### Data Protection

**Message Content:**

- No persistent storage of message payloads
- Secure transmission over HTTPS
- Proper encoding for special characters
- Truncation for large messages in UI

**Sensitive Information:**

- No logging of message payloads
- Secure handling of connection credentials
- Proper error message sanitization
- Audit trail for administrative actions

## Performance Considerations

### Backend Performance

**API Efficiency:**

- Minimal RabbitMQ API calls per operation
- Efficient virtual host caching
- Proper connection pooling utilization
- Asynchronous operation handling

**Resource Management:**

- Memory-efficient message handling
- Proper cleanup of temporary resources
- Connection timeout management
- Rate limiting for bulk operations

### Frontend Performance

**UI Responsiveness:**

- Lazy loading of virtual host lists
- Debounced form validation
- Efficient re-rendering on updates
- Progressive loading for large message lists

**Network Optimization:**

- Minimal API calls for form population
- Efficient caching of virtual host data
- Proper error retry mechanisms
- Optimistic UI updates where appropriate

### Scalability Considerations

**Large Deployments:**

- Pagination for virtual host lists
- Efficient handling of many exchanges/queues
- Proper timeout handling for slow operations
- Graceful degradation for overloaded clusters

**Message Volume:**

- Truncation limits for message display
- Efficient encoding for large payloads
- Proper memory management for message lists
- User-configurable limits for message retrieval
