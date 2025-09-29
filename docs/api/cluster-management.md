# Cluster Management API

This document describes the Cluster Management API endpoints for creating, updating, and managing RabbitMQ cluster connections with user assignments.

## Overview

The Cluster Management API allows administrators to manage RabbitMQ cluster connections and assign users to specific clusters. All endpoints require administrator authentication and provide comprehensive cluster lifecycle management.

## Base URL

```
/api/clusters
```

## Authentication

Cluster management endpoints have differentiated access control:

- **Read operations**: Require USER or ADMINISTRATOR role
- **Write operations**: Require ADMINISTRATOR role only

Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Data Transfer Objects

### ClusterConnection

```typescript
interface ClusterConnection {
  id: string;
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  description?: string;
  active: boolean;
  assignedUsers: User[];
}

interface User {
  id: string;
  username: string;
  role: string;
}
```

### Request DTOs

```typescript
interface CreateClusterConnectionRequest {
  name: string;
  apiUrl: string;
  username: string;
  password: string;
  description?: string;
  active: boolean;
  assignedUserIds?: string[]; // Array of UUID strings - empty array creates cluster with no users
}

interface UpdateClusterConnectionRequest {
  name?: string;
  apiUrl?: string;
  username?: string;
  password?: string;
  description?: string;
  active?: boolean;
  assignedUserIds?: string[]; // Array of UUID strings - empty array removes all users, omit to leave unchanged
}

interface ConnectionTestRequest {
  apiUrl: string;
  username: string;
  password: string;
}

interface ConnectionTestResponse {
  successful: boolean;
  message: string;
  errorDetails?: string;
  responseTimeMs?: number;
}
```

## Endpoints

### Get All Cluster Connections

Retrieves all cluster connections.

**Endpoint:** `GET /api/clusters`

**Authorization:** USER or ADMINISTRATOR role required

**Response Example:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Production Cluster",
      "apiUrl": "https://rabbitmq-prod.example.com:15672",
      "username": "admin",
      "description": "Main production RabbitMQ cluster",
      "active": true,
      "assignedUsers": [
        {
          "id": "user-123",
          "username": "john.doe",
          "role": "USER"
        },
        {
          "id": "user-456",
          "username": "jane.smith",
          "role": "ADMINISTRATOR"
        }
      ]
    }
  ]
}
```

### Get Active Cluster Connections

Retrieves only active cluster connections.

**Endpoint:** `GET /api/clusters/active`

**Authorization:** USER or ADMINISTRATOR role required

**Response:** Same format as above, filtered to active clusters only.

### Get Cluster Connection by ID

Retrieves a specific cluster connection by ID.

**Endpoint:** `GET /api/clusters/{id}`

**Parameters:**

- `id` (path): UUID of the cluster connection

**Authorization:** USER or ADMINISTRATOR role required

**Response Example:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Production Cluster",
  "apiUrl": "https://rabbitmq-prod.example.com:15672",
  "username": "admin",
  "description": "Main production RabbitMQ cluster",
  "active": true,
  "assignedUsers": [
    {
      "id": "user-123",
      "username": "john.doe",
      "role": "USER"
    }
  ]
}
```

### Create Cluster Connection

Creates a new cluster connection with optional user assignments.

**Endpoint:** `POST /api/clusters`

**Authorization:** Administrator role required

**Request Body:**

```json
{
  "name": "Development Cluster",
  "apiUrl": "http://localhost:15672",
  "username": "admin",
  "password": "admin123",
  "description": "Local development cluster",
  "active": true,
  "assignedUserIds": ["user-123", "user-456"]
}
```

**User Assignment Options:**

- `assignedUserIds`: Array of user UUIDs to assign to the cluster
- Pass an empty array `[]` to create a cluster with no user assignments
- Omit the field to create a cluster with no user assignments

**Response:** Returns the created cluster connection with assigned users populated.

**Status Codes:**

- `201 Created`: Cluster connection created successfully
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Cluster name already exists

### Update Cluster Connection

Updates an existing cluster connection, including user assignments.

**Endpoint:** `PUT /api/clusters/{id}`

**Parameters:**

- `id` (path): UUID of the cluster connection

**Authorization:** Administrator role required

**Request Body:**

```json
{
  "name": "Updated Production Cluster",
  "apiUrl": "https://rabbitmq-prod-new.example.com:15672",
  "username": "admin",
  "password": "newpassword123",
  "description": "Updated production cluster",
  "active": true,
  "assignedUserIds": ["user-123", "user-789"]
}
```

**User Assignment Examples:**

```json
// Assign specific users
{
  "assignedUserIds": ["user-123", "user-456"]
}

// Remove all user assignments
{
  "assignedUserIds": []
}

// Leave user assignments unchanged (omit the field)
{
  "name": "Updated name only"
}
```

**Notes:**

- All fields are optional in update requests
- If `password` is omitted or empty, the existing password is preserved
- If `assignedUserIds` is provided, it completely replaces the current user assignments:
  - An empty array `[]` will remove all user assignments from the cluster
  - A non-empty array will assign only the specified users
  - If omitted (null), user assignments remain unchanged
- User assignment operations properly maintain bidirectional relationships between users and clusters
- User assignment operations are logged for audit purposes with cluster ID and user count information

**Response:** Returns the updated cluster connection with current user assignments.

**Status Codes:**

- `200 OK`: Cluster connection updated successfully
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Cluster connection not found
- `409 Conflict`: Cluster name already exists (if name changed)

### Delete Cluster Connection

Deletes a cluster connection and all associated user assignments.

**Endpoint:** `DELETE /api/clusters/{id}`

**Parameters:**

- `id` (path): UUID of the cluster connection

**Authorization:** Administrator role required

**Response:** No content

**Status Codes:**

- `204 No Content`: Cluster connection deleted successfully
- `404 Not Found`: Cluster connection not found

### Test Connection

Tests connectivity to a RabbitMQ Management API with provided credentials.

**Endpoint:** `POST /api/clusters/test`

**Authorization:** Administrator role required

**Request Body:**

```json
{
  "apiUrl": "http://localhost:15672",
  "username": "admin",
  "password": "admin123"
}
```

**Response Example:**

```json
{
  "successful": true,
  "message": "Connection successful",
  "responseTimeMs": 245
}
```

**Error Response Example:**

```json
{
  "successful": false,
  "message": "Authentication failed",
  "errorDetails": "HTTP 401: Unauthorized"
}
```

### Test Existing Cluster Connection

Tests connectivity for an existing cluster connection using stored credentials.

**Endpoint:** `POST /api/clusters/{id}/test`

**Parameters:**

- `id` (path): UUID of the cluster connection

**Authorization:** Administrator role required

**Response:** Same format as connection test above.

## User Assignment Management

### Assign User to Cluster

Assigns a single user to a cluster connection.

**Endpoint:** `POST /api/clusters/{clusterId}/users/{userId}`

**Parameters:**

- `clusterId` (path): UUID of the cluster connection
- `userId` (path): UUID of the user

**Authorization:** Administrator role required

**Response:** No content

**Status Codes:**

- `200 OK`: User assigned successfully
- `404 Not Found`: Cluster or user not found
- `409 Conflict`: User already assigned to cluster

### Remove User from Cluster

Removes a user assignment from a cluster connection.

**Endpoint:** `DELETE /api/clusters/{clusterId}/users/{userId}`

**Parameters:**

- `clusterId` (path): UUID of the cluster connection
- `userId` (path): UUID of the user

**Authorization:** Administrator role required

**Response:** No content

**Status Codes:**

- `200 OK`: User assignment removed successfully
- `404 Not Found`: Cluster, user, or assignment not found

### Get Users Assigned to Cluster

Retrieves all users assigned to a specific cluster connection.

**Endpoint:** `GET /api/clusters/{clusterId}/users`

**Parameters:**

- `clusterId` (path): UUID of the cluster connection

**Authorization:** USER or ADMINISTRATOR role required

**Response Example:**

```json
[
  {
    "id": "user-123",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "role": "USER",
    "active": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "user-456",
    "username": "jane.smith",
    "email": "jane.smith@example.com",
    "role": "ADMINISTRATOR",
    "active": true,
    "createdAt": "2024-01-10T08:15:00Z"
  }
]
```

### Get Users Not Assigned to Cluster

Retrieves all users who are not assigned to a specific cluster connection.

**Endpoint:** `GET /api/clusters/{clusterId}/users/unassigned`

**Parameters:**

- `clusterId` (path): UUID of the cluster connection

**Authorization:** USER or ADMINISTRATOR role required

**Response:** Same format as assigned users list above.

## User-Specific Endpoints

### Get My Cluster Connections

Retrieves cluster connections assigned to the current authenticated user.

**Endpoint:** `GET /api/clusters/my`

**Authorization:** Any authenticated user (USER or ADMINISTRATOR role)

**Response:** List of cluster connections accessible to the current user.

### Get My Active Cluster Connections

Retrieves active cluster connections assigned to the current authenticated user.

**Endpoint:** `GET /api/clusters/my/active`

**Authorization:** Any authenticated user (USER or ADMINISTRATOR role)

**Response:** List of active cluster connections accessible to the current user.

### Get Cluster Connections for User

Retrieves cluster connections assigned to a specific user.

**Endpoint:** `GET /api/clusters/by-user/{userId}`

**Parameters:**

- `userId` (path): UUID of the user

**Authorization:** USER or ADMINISTRATOR role required

**Response:** List of cluster connections assigned to the specified user.

### Get Active Cluster Connections for User

Retrieves active cluster connections assigned to a specific user.

**Endpoint:** `GET /api/clusters/by-user/{userId}/active`

**Parameters:**

- `userId` (path): UUID of the user

**Authorization:** USER or ADMINISTRATOR role required

**Response:** List of active cluster connections assigned to the specified user.

## Utility Endpoints

### Check Cluster Name Exists

Checks if a cluster name already exists in the system.

**Endpoint:** `GET /api/clusters/exists/{name}`

**Parameters:**

- `name` (path): Cluster name to check

**Authorization:** USER or ADMINISTRATOR role required

**Response Example:**

```json
{
  "exists": true
}
```

## Error Responses

### 400 Bad Request

Invalid request data or validation errors.

```json
{
  "error": "Bad Request",
  "message": "Cluster name must be between 1 and 100 characters",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/clusters"
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

Insufficient permissions (non-administrator trying to access admin endpoints).

```json
{
  "error": "Forbidden",
  "message": "Administrator role required",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 404 Not Found

Cluster connection or user not found.

```json
{
  "error": "Not Found",
  "message": "Cluster connection not found",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 409 Conflict

Duplicate cluster name or user assignment conflict.

```json
{
  "error": "Conflict",
  "message": "A cluster connection with this name already exists",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 500 Internal Server Error

Server error or RabbitMQ cluster connectivity issues.

```json
{
  "error": "Internal Server Error",
  "message": "Failed to connect to RabbitMQ cluster",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Usage Examples

### JavaScript/TypeScript Usage

```typescript
const API_BASE = "/api/clusters";
const token = localStorage.getItem("jwt-token");

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// Create cluster connection with user assignments
async function createCluster(clusterData: CreateClusterConnectionRequest) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify(clusterData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Update cluster connection and user assignments
async function updateCluster(
  id: string,
  updates: UpdateClusterConnectionRequest
) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Test connection before creating/updating
async function testConnection(connectionData: ConnectionTestRequest) {
  const response = await fetch(`${API_BASE}/test`, {
    method: "POST",
    headers,
    body: JSON.stringify(connectionData),
  });

  return response.json();
}

// Get user's accessible clusters
async function getMyActiveClusters() {
  const response = await fetch(`${API_BASE}/my/active`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Manage user assignments
async function assignUserToCluster(clusterId: string, userId: string) {
  const response = await fetch(`${API_BASE}/${clusterId}/users/${userId}`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

async function removeUserFromCluster(clusterId: string, userId: string) {
  const response = await fetch(`${API_BASE}/${clusterId}/users/${userId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Get cluster user assignments
async function getClusterUsers(clusterId: string) {
  const response = await fetch(`${API_BASE}/${clusterId}/users`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
```

### React Hook Example

```typescript
import { useState, useEffect, useCallback } from "react";

interface UseClusterManagementResult {
  clusters: ClusterConnection[];
  loading: boolean;
  error: string | null;
  createCluster: (
    data: CreateClusterConnectionRequest
  ) => Promise<ClusterConnection>;
  updateCluster: (
    id: string,
    data: UpdateClusterConnectionRequest
  ) => Promise<ClusterConnection>;
  deleteCluster: (id: string) => Promise<void>;
  testConnection: (
    data: ConnectionTestRequest
  ) => Promise<ConnectionTestResponse>;
  refetch: () => void;
}

function useClusterManagement(): UseClusterManagementResult {
  const [clusters, setClusters] = useState<ClusterConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clusters", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setClusters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCluster = useCallback(
    async (data: CreateClusterConnectionRequest) => {
      const response = await fetch("/api/clusters", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const cluster = await response.json();
      setClusters((prev) => [...prev, cluster]);
      return cluster;
    },
    []
  );

  const updateCluster = useCallback(
    async (id: string, data: UpdateClusterConnectionRequest) => {
      const response = await fetch(`/api/clusters/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedCluster = await response.json();
      setClusters((prev) =>
        prev.map((c) => (c.id === id ? updatedCluster : c))
      );
      return updatedCluster;
    },
    []
  );

  const deleteCluster = useCallback(async (id: string) => {
    const response = await fetch(`/api/clusters/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setClusters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const testConnection = useCallback(async (data: ConnectionTestRequest) => {
    const response = await fetch("/api/clusters/test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt-token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  return {
    clusters,
    loading,
    error,
    createCluster,
    updateCluster,
    deleteCluster,
    testConnection,
    refetch: fetchClusters,
  };
}
```

### cURL Examples

```bash
# Get all clusters (USER or ADMINISTRATOR role)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/clusters

# Create cluster with user assignments
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Cluster",
    "apiUrl": "https://rabbitmq-prod.example.com:15672",
    "username": "admin",
    "password": "secure-password",
    "description": "Main production cluster",
    "active": true,
    "assignedUserIds": ["user-123", "user-456"]
  }' \
  http://localhost:8080/api/clusters

# Update cluster user assignments
curl -X PUT \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedUserIds": ["user-123", "user-789"]
  }' \
  http://localhost:8080/api/clusters/123e4567-e89b-12d3-a456-426614174000

# Remove all user assignments from cluster
curl -X PUT \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedUserIds": []
  }' \
  http://localhost:8080/api/clusters/123e4567-e89b-12d3-a456-426614174000

# Test connection
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiUrl": "http://localhost:15672",
    "username": "admin",
    "password": "admin123"
  }' \
  http://localhost:8080/api/clusters/test

# Get my accessible clusters (any authenticated user)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/clusters/my/active

# Assign user to cluster
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/clusters/123e4567-e89b-12d3-a456-426614174000/users/user-456

# Get users assigned to cluster
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8080/api/clusters/123e4567-e89b-12d3-a456-426614174000/users
```

## Security Considerations

- All endpoints require valid JWT authentication
- Administrator role required for cluster management operations
- User assignment operations are restricted to administrators
- Passwords are never returned in API responses
- Connection test credentials are not stored
- All operations are logged for audit purposes, including detailed user assignment tracking
- Rate limiting applies to prevent abuse

## Best Practices

1. **User Assignment Management**:
   - Use bulk assignment via create/update requests rather than individual assignment calls for better performance
   - To remove all users from a cluster, pass an empty array `[]` in `assignedUserIds`
   - To leave user assignments unchanged during updates, omit the `assignedUserIds` field entirely
2. **Connection Testing**: Always test connections before creating or updating cluster configurations
3. **Password Security**: Use strong passwords and consider rotating them regularly
4. **Error Handling**: Implement proper error handling for network connectivity issues
5. **Caching**: Cache cluster lists on the client side with appropriate TTL
6. **Validation**: Validate cluster URLs and credentials on the client side before submission
