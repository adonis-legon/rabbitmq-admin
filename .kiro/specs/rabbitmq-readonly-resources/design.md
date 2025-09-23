# Design Document

## Overview

The RabbitMQ Readonly Resources feature extends the existing RabbitMQ Admin application with comprehensive resource browsing capabilities. This feature provides read-only access to view connections, channels, exchanges (with bindings), and queues from assigned RabbitMQ clusters. The design leverages the existing authentication, authorization, and RabbitMQ proxy infrastructure while adding new frontend components and backend endpoints for resource management.

The feature follows the established three-tier architecture pattern and integrates seamlessly with the existing Material UI design system and navigation structure.

## Architecture

### High-Level Architecture Extension

```mermaid
graph TB
    subgraph "Frontend Extension"
        RES[Resource Management Pages]
        NAV[Navigation Integration]
        COMP[Reusable Components]
    end

    subgraph "Existing Frontend"
        DASH[Dashboard]
        AUTH[Authentication]
        LAYOUT[App Layout]
    end

    subgraph "Backend Extension"
        RPROXY[RabbitMQ Resource Proxy]
        RCTRL[Resource Controllers]
    end

    subgraph "Existing Backend"
        PROXY[RabbitMQ Proxy Service]
        SEC[Security Layer]
        BFF[Spring Boot BFF]
    end

    subgraph "RabbitMQ Management API"
        CONN[/api/connections]
        CHAN[/api/channels]
        EXCH[/api/exchanges]
        QUEUE[/api/queues]
        BIND[/api/bindings]
    end

    RES --> RCTRL
    RES --> NAV
    NAV --> LAYOUT
    RCTRL --> RPROXY
    RPROXY --> PROXY
    PROXY --> CONN
    PROXY --> CHAN
    PROXY --> EXCH
    PROXY --> QUEUE
    PROXY --> BIND
```

### RabbitMQ Management API Integration

The design leverages the RabbitMQ Management HTTP API endpoints:

- **Connections**: `GET /api/connections` - Lists all connections with client info, state, and statistics
- **Channels**: `GET /api/channels` - Lists all channels with connection info, consumer count, and message stats
- **Exchanges**: `GET /api/exchanges` - Lists exchanges with type, durability, and arguments
- **Queues**: `GET /api/queues` - Lists queues with message counts, consumer info, and state
- **Bindings**: `GET /api/bindings` - Lists all bindings between exchanges and queues/exchanges

### Pagination Strategy

RabbitMQ Management API supports pagination through query parameters:

- `page`: Page number (1-based)
- `page_size`: Number of items per page (default: 100, max: 500)
- `name`: Filter by name pattern
- `use_regex`: Enable regex filtering

## Components and Interfaces

### Frontend Components

#### Core Resource Components

**ResourceLayout**: Main container for resource management pages

- Integrates with existing AppLayout
- Provides consistent navigation tabs (Connections, Channels, Exchanges, Queues)
- Handles cluster selection validation
- Manages loading and error states

**ResourceTable**: Reusable data table component

- Material UI DataGrid integration
- Built-in pagination, sorting, and filtering
- Configurable columns and row actions
- Loading skeleton and empty states
- Responsive design for mobile/tablet

**ResourceDetailModal**: Modal component for detailed resource information

- Expandable sections for different data categories
- JSON viewer for complex properties
- Real-time data refresh capability
- Copy-to-clipboard functionality

#### Specific Resource Components

**ConnectionsList**: Displays RabbitMQ connections

```typescript
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
```

**ChannelsList**: Displays RabbitMQ channels

```typescript
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
}
```

**ExchangesList**: Displays RabbitMQ exchanges with bindings

```typescript
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

**QueuesList**: Displays RabbitMQ queues

```typescript
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
```

#### Core Type Definitions

**PagedResponse**: Generic pagination wrapper for all resource endpoints

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

**ResourceFilters**: Filter configuration for resource browsing

```typescript
export interface ResourceFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  stateFilter: string[];
  typeFilter: string[];
}
```

**ResourceError**: Error handling for resource operations

```typescript
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

#### Shared UI Components

**ResourceFilters**: Filtering and search component

- Text search with debouncing (implemented via useDebouncedSearch hook)
- State/type filters with multi-select
- Clear filters functionality
- Filter persistence across navigation

**PaginationControls**: Pagination component

- Page size selector (25, 50, 100, 200)
- Page navigation with first/last buttons
- Total count display
- Jump to page functionality

**RefreshControls**: Data refresh component

- Manual refresh button
- Auto-refresh toggle with interval selection
- Last updated timestamp
- Refresh status indicator

#### Performance Optimization Components

**ResourceCache**: Client-side caching utility

```typescript
export class ResourceCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  // Generate cache keys from cluster ID, resource type, and parameters
  private generateKey(
    clusterId: string,
    resourceType: string,
    params: Record<string, any>
  ): string;

  // Check if cache entry is still valid based on TTL
  private isValid(entry: CacheEntry<T>): boolean;

  // Automatic cleanup of expired entries
  private cleanup(): void;

  // LRU eviction when cache exceeds max size
  private enforceMaxSize(): void;

  // Get cached data if available and valid
  get(
    clusterId: string,
    resourceType: string,
    params: Record<string, any>
  ): T | null;

  // Set cached data with optional custom TTL
  set(
    clusterId: string,
    resourceType: string,
    data: T,
    params: Record<string, any>,
    customTTL?: number
  ): void;

  // Invalidate cache entries for specific cluster/resource type
  invalidate(clusterId: string, resourceType?: string): void;

  // Get cache performance statistics
  getStats(): CacheStats;
}
```

**Cache Instances**: Resource-specific cache configurations

- `connectionsCache`: 30-second TTL for highly dynamic connection data
- `channelsCache`: 30-second TTL for dynamic channel information
- `exchangesCache`: 5-minute TTL for relatively static exchange configuration
- `queuesCache`: 1-minute TTL for moderately dynamic queue data
- `bindingsCache`: 10-minute TTL for static binding relationships

### Backend Components

#### Controller Layer Extensions

**RabbitMQResourceController**: New controller for resource endpoints

```java
@RestController
@RequestMapping("/api/rabbitmq/{clusterId}/resources")
@PreAuthorize("hasRole('USER')")
public class RabbitMQResourceController {

    @GetMapping("/connections")
    public ResponseEntity<PagedResponse<Connection>> getConnections(
        @PathVariable UUID clusterId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int pageSize,
        @RequestParam(required = false) String name,
        @RequestParam(defaultValue = "false") boolean useRegex
    );

    @GetMapping("/channels")
    public ResponseEntity<PagedResponse<Channel>> getChannels(
        @PathVariable UUID clusterId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int pageSize,
        @RequestParam(required = false) String name
    );

    @GetMapping("/exchanges")
    public ResponseEntity<PagedResponse<Exchange>> getExchanges(
        @PathVariable UUID clusterId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int pageSize,
        @RequestParam(required = false) String name
    );

    @GetMapping("/queues")
    public ResponseEntity<PagedResponse<Queue>> getQueues(
        @PathVariable UUID clusterId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int pageSize,
        @RequestParam(required = false) String name
    );

    @GetMapping("/exchanges/{exchangeName}/bindings")
    public ResponseEntity<List<Binding>> getExchangeBindings(
        @PathVariable UUID clusterId,
        @PathVariable String exchangeName
    );

    @GetMapping("/queues/{queueName}/bindings")
    public ResponseEntity<List<Binding>> getQueueBindings(
        @PathVariable UUID clusterId,
        @PathVariable String queueName
    );
}
```

#### Service Layer Extensions

**RabbitMQResourceService**: Service for resource operations

```java
@Service
public class RabbitMQResourceService {

    private final RabbitMQProxyService proxyService;
    private final ClusterConnectionService clusterService;

    public PagedResponse<Connection> getConnections(UUID clusterId, PaginationRequest request);
    public PagedResponse<Channel> getChannels(UUID clusterId, PaginationRequest request);
    public PagedResponse<Exchange> getExchanges(UUID clusterId, PaginationRequest request);
    public PagedResponse<Queue> getQueues(UUID clusterId, PaginationRequest request);
    public List<Binding> getBindings(UUID clusterId, String source, String destination);

    private <T> PagedResponse<T> executePagedRequest(UUID clusterId, String endpoint,
                                                   PaginationRequest request, Class<T> responseType);
}
```

#### Data Transfer Objects

**PagedResponse**: Generic pagination wrapper

```java
public class PagedResponse<T> {
    private List<T> items;
    private int page;
    private int pageSize;
    private int totalItems;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}

public class PaginationRequest {
    private int page = 1;
    private int pageSize = 50;
    private String name;
    private boolean useRegex = false;
}
```

### API Design

#### Resource Endpoints

```
GET /api/rabbitmq/{clusterId}/resources/connections
  ?page=1&pageSize=50&name=filter&useRegex=false

GET /api/rabbitmq/{clusterId}/resources/channels
  ?page=1&pageSize=50&name=filter

GET /api/rabbitmq/{clusterId}/resources/exchanges
  ?page=1&pageSize=50&name=filter

GET /api/rabbitmq/{clusterId}/resources/queues
  ?page=1&pageSize=50&name=filter

GET /api/rabbitmq/{clusterId}/resources/exchanges/{exchangeName}/bindings

GET /api/rabbitmq/{clusterId}/resources/queues/{queueName}/bindings
```

#### Response Format

**Paged Resource Response:**

```json
{
  "items": [
    {
      "name": "connection-1",
      "state": "running",
      "channels": 2,
      "client_properties": {
        "connection_name": "MyApp Connection",
        "platform": "Java",
        "product": "RabbitMQ Java Client",
        "version": "5.16.0"
      },
      "host": "localhost",
      "peer_host": "192.168.1.100",
      "port": 5672,
      "peer_port": 54321,
      "protocol": "AMQP 0-9-1",
      "user": "guest",
      "vhost": "/",
      "connected_at": 1640995200000
    }
  ],
  "page": 1,
  "pageSize": 50,
  "totalItems": 150,
  "totalPages": 3,
  "hasNext": true,
  "hasPrevious": false
}
```

## Data Models

### Frontend State Management

**ResourceState**: Redux/Context state for resource management

```typescript
interface ResourceState {
  connections: {
    data: PagedResponse<Connection>;
    loading: boolean;
    error: string | null;
    filters: ResourceFilters;
  };
  channels: {
    data: PagedResponse<Channel>;
    loading: boolean;
    error: string | null;
    filters: ResourceFilters;
  };
  exchanges: {
    data: PagedResponse<Exchange>;
    loading: boolean;
    error: string | null;
    filters: ResourceFilters;
  };
  queues: {
    data: PagedResponse<Queue>;
    loading: boolean;
    error: string | null;
    filters: ResourceFilters;
  };
  selectedCluster: string | null;
  autoRefresh: {
    enabled: boolean;
    interval: number; // seconds
  };
}

interface ResourceFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  stateFilter: string[];
  typeFilter: string[];
}
```

### Backend Data Models

**Resource DTOs**: Data transfer objects for API responses

```java
// Connection DTO
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConnectionDto {
    private String name;
    private String state;
    private Integer channels;
    private Map<String, Object> clientProperties;
    private String host;
    private String peerHost;
    private Integer port;
    private Integer peerPort;
    private String protocol;
    private String user;
    private String vhost;
    private Long connectedAt;
    // Statistics fields
    private Long recvOct;
    private Long recvCnt;
    private Long sendOct;
    private Long sendCnt;
}

// Channel DTO
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChannelDto {
    private String name;
    private Integer number;
    private String state;
    private Integer consumerCount;
    private Integer messagesUnacknowledged;
    private Integer messagesUnconfirmed;
    private Integer prefetchCount;
    private Boolean transactional;
    private Boolean confirm;
    private String user;
    private String vhost;
    private Map<String, Object> connectionDetails;
    // Consumer details for channel detail modal
    private List<Map<String, Object>> consumerDetails;
    // Message statistics for detailed channel information
    private Map<String, Object> messageStats;
}

// Exchange DTO
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExchangeDto {
    private String name;
    private String type;
    private Boolean durable;
    private Boolean autoDelete;
    private Boolean internal;
    private Map<String, Object> arguments;
    private String vhost;
    private Map<String, Object> messageStats;
}

// Queue DTO
@JsonIgnoreProperties(ignoreUnknown = true)
public class QueueDto {
    private String name;
    private String state;
    private Boolean durable;
    private Boolean autoDelete;
    private Boolean exclusive;
    private Map<String, Object> arguments;
    private String node;
    private String vhost;
    private Integer messages;
    private Integer messagesReady;
    private Integer messagesUnacknowledged;
    private Integer consumers;
    private Double consumerUtilisation;
    private Long memory;
    private Map<String, Object> messageStats;
    private List<Map<String, Object>> consumerDetails;
}

// Binding DTO
@JsonIgnoreProperties(ignoreUnknown = true)
public class BindingDto {
    private String source;
    private String destination;
    private String destinationType;
    private String routingKey;
    private Map<String, Object> arguments;
    private String propertiesKey;
    private String vhost;
}
```

## Error Handling

### Frontend Error Handling

**ResourceErrorBoundary**: Enhanced error boundary for resource components

- Catches and displays component-level errors with comprehensive error information
- Provides retry functionality with automatic error state reset
- Enhanced with `getDerivedStateFromProps` for automatic error recovery when children change
- Improved user experience with automatic error state reset during navigation
- Logs errors for debugging with detailed context information
- Graceful degradation for partial failures
- Context-aware error suggestions based on error type and resource context

**API Error Handling**: Centralized error handling for resource API calls

- Network timeout handling (30-second timeout)
- RabbitMQ cluster connectivity errors
- Authentication/authorization errors
- Rate limiting and retry logic with exponential backoff
- User-friendly error messages with actionable suggestions

**Error States**: Comprehensive error state management

```typescript
interface ResourceError {
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

### Backend Error Handling

**Resource Exception Handling**: Specific exception handling for resource operations

```java
@ControllerAdvice
public class ResourceExceptionHandler {

    @ExceptionHandler(ClusterUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleClusterUnavailable(ClusterUnavailableException ex);

    @ExceptionHandler(RabbitMQApiException.class)
    public ResponseEntity<ErrorResponse> handleRabbitMQApiError(RabbitMQApiException ex);

    @ExceptionHandler(PaginationException.class)
    public ResponseEntity<ErrorResponse> handlePaginationError(PaginationException ex);
}
```

**Timeout and Retry Configuration**: Resilient API calls

- Connection timeout: 10 seconds
- Read timeout: 30 seconds
- Retry attempts: 3 with exponential backoff
- Circuit breaker pattern for cluster health

## Testing Strategy

### Frontend Testing

**Component Tests**: React Testing Library tests for all resource components

- ResourceTable pagination and filtering
- ResourceDetailModal data display
- Error boundary behavior
- Loading state handling
- User interaction flows
- ✅ VirtualizedResourceTable placeholder implementation testing with comprehensive TypeScript interface validation
- ✅ Future implementation readiness testing with dependency awareness and clear user messaging

**Integration Tests**: End-to-end resource browsing flows

- Navigation between resource types
- Pagination and filtering workflows
- Error handling scenarios
- Auto-refresh functionality
- Cluster switching behavior

**API Integration Tests**: Mock API responses for resource endpoints

- Successful data loading scenarios
- Error response handling
- Pagination edge cases
- Network failure simulation

### Backend Testing

**Controller Tests**: `@WebMvcTest` for resource endpoints

- Pagination parameter validation
- Authentication and authorization
- Error response formatting
- Request/response mapping

**Service Tests**: Unit tests for resource service logic

- RabbitMQ API integration with reactive WebClient patterns
- Pagination logic
- Error handling and retry mechanisms using reactive operators
- Data transformation and mapping
- Non-blocking test execution with `StepVerifier` for reactive streams

**Integration Tests**: Full API flow testing

- Real RabbitMQ API interaction (with TestContainers)
- Authentication flow with resource access
- Cluster permission validation
- Error propagation and handling

### Performance Testing

**Load Testing**: Resource endpoint performance

- Concurrent user scenarios
- Large dataset pagination
- Memory usage optimization
- Response time benchmarks

**RabbitMQ API Testing**: External API interaction testing

- Rate limiting behavior
- Connection pooling efficiency
- Timeout handling
- Error recovery scenarios

## Security Considerations

### Access Control

**Cluster-Level Authorization**: Resource access validation

- Verify user has access to requested cluster
- Validate cluster is active and accessible
- Audit resource access attempts
- Session-based cluster selection validation

**API Security**: Secure resource endpoint access

- JWT token validation for all endpoints
- Role-based access control (USER role minimum)
- Request rate limiting per user/cluster
- Input validation and sanitization

### Data Security

**Sensitive Information Handling**: Protect sensitive RabbitMQ data

- Filter sensitive connection properties
- Mask credentials in client properties
- Sanitize user-provided filter inputs
- Prevent information disclosure through error messages

**Audit Logging**: Track resource access patterns

- Log resource access attempts with user/cluster context
- Monitor for unusual access patterns
- Track failed authentication attempts
- Record cluster connectivity issues

## Performance Considerations

### Frontend Performance

**Data Virtualization**: Efficient large dataset handling

- ✅ VirtualizedResourceTable placeholder implementation with comprehensive TypeScript interfaces
- Virtual scrolling for large resource lists (pending react-window dependency installation)
- Lazy loading of detailed information
- ✅ Debounced search and filtering
- Optimized re-rendering with React.memo

**Caching Strategy**: Intelligent data caching

- ✅ Browser-based caching for resource data with configurable TTL
- ✅ Cache invalidation on manual refresh and by cluster/resource type
- ✅ Memory-efficient cache size limits with LRU eviction
- ✅ Resource-specific cache instances with optimized TTL values
- ✅ Automatic cleanup of expired entries
- ✅ Cache statistics and performance monitoring
- ✅ Cache integration with useConnections hook (cache-first loading strategy)
- ✅ Cache invalidation on manual refresh operations
- Stale-while-revalidate pattern for auto-refresh (planned)
- ✅ VirtualizedResourceTable placeholder with proper error handling, loading states, and TypeScript interfaces
- Virtual scrolling integration (pending react-window dependency: `npm install react-window @types/react-window`)
- Cache integration with remaining resource hooks (in progress)

**Cache Implementation Details**:

The `ResourceCache` class provides a robust foundation for client-side caching:

- **TTL-based Expiration**: Each cache entry has a configurable time-to-live
- **LRU Eviction**: Oldest entries are removed when cache reaches size limit
- **Parameterized Keys**: Cache keys include pagination and filter parameters
- **Cluster Isolation**: Cache entries are isolated by cluster ID
- **Automatic Maintenance**: Background cleanup of expired entries
- **Performance Monitoring**: Built-in statistics for cache hit rates and health

The implementation supports different TTL values optimized for each resource type:

- Connections/Channels: 30 seconds (highly dynamic)
- Queues: 1 minute (moderately dynamic)
- Exchanges: 5 minutes (less dynamic)
- Bindings: 10 minutes (least dynamic)

**Cache Integration Pattern**:

The `useConnections` hook demonstrates the established pattern for cache integration:

1. **Cache-First Loading**: Check cache before making API calls
2. **Fallback Strategy**: If cache miss or data stale, fetch from API
3. **Cache Storage**: Store API responses in cache with appropriate TTL
4. **Cache Invalidation**: Clear cache entries on manual refresh operations
5. **Parameter-Aware Caching**: Include pagination and filter parameters in cache keys

```typescript
// Cache retrieval pattern
const cachedData = connectionsCache.get(clusterId, "connections", params);
if (cachedData && !loading) {
  setData(cachedData);
  setLoading(false);
  return;
}

// Cache storage pattern
const response = await executeOperation(
  () => rabbitmqResourcesApi.getConnections(clusterId, params),
  "load"
);
connectionsCache.set(clusterId, "connections", response, params);

// Cache invalidation pattern
connectionsCache.invalidate(lastParams.clusterId, "connections");
```

### Backend Performance

**RabbitMQ API Optimization**: Efficient external API usage

- Connection pooling for RabbitMQ API calls
- Request batching where possible
- Intelligent pagination size optimization
- Response caching for frequently accessed data

**Database Performance**: Minimal database impact

- Leverage existing cluster connection validation
- Cache cluster credentials for API calls
- Optimize user permission checks
- Minimal additional database queries

### Monitoring and Metrics

**Performance Metrics**: Track resource browsing performance

- API response times per resource type
- Frontend rendering performance
- RabbitMQ API call success rates
- User engagement with resource features

**Health Monitoring**: Resource feature health checks

- RabbitMQ cluster connectivity status
- API endpoint availability
- Error rate monitoring
- Performance threshold alerting
