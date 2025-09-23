# RabbitMQ Resource Management API

This document describes the RabbitMQ Resource Management API endpoints that provide read-only access to RabbitMQ cluster resources.

## Overview

The RabbitMQ Resource Management API allows authenticated users to browse and inspect resources from their assigned RabbitMQ clusters. All endpoints require authentication and users can only access clusters they have been assigned to.

**Architecture Note**: The API has been migrated from a reactive (WebFlux/Mono-based) to a synchronous (blocking) architecture for improved simplicity and debugging capabilities while maintaining high performance through optimized connection pooling and caching.

**Frontend Integration**: The resource management interface supports direct URL navigation to specific resource pages (e.g., `/resources/connections`, `/resources/queues`) through client-side routing, enabling bookmarking and direct linking to resource views.

## Base URL

```
/api/rabbitmq/{clusterId}/resources
```

Where `{clusterId}` is the UUID of the cluster connection.

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

**Token Expiration Handling**: The frontend application automatically handles token expiration with seamless navigation to the login page while preserving the user's intended destination for post-login redirect.

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

- `vhost`: The virtual host name (URL encoded)
- `exchangeName`: The name of the exchange (URL encoded)

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

- `vhost`: The virtual host name (URL encoded)
- `queueName`: The name of the queue (URL encoded)

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
- **Material UI Icons**: Each resource type has a dedicated icon (Cable for Connections, Hub for Channels, SwapHoriz for Exchanges, Queue for Queues)
- **Responsive Behavior**: Navigation adapts to different screen sizes and provides proper mobile support

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
