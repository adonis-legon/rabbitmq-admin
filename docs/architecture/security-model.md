# Security Model

## Overview

The RabbitMQ Admin application implements a comprehensive security model using Spring Security with JWT authentication and role-based access control (RBAC).

## Authentication

### JWT Token-Based Authentication

- **Token Format**: JSON Web Tokens (JWT) with configurable expiration
- **Token Storage**: Client-side storage with automatic refresh handling
- **Token Validation**: Server-side validation on every request
- **Expiration Handling**: Automatic redirect to login on token expiration

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials and generates JWT token
3. Client stores token and includes it in subsequent requests
4. Server validates token on each protected endpoint access
5. Token refresh handled automatically before expiration

## Authorization

### Role-Based Access Control (RBAC)

The application uses two primary roles:

- **USER**: Standard user with access to assigned clusters and resource management
- **ADMINISTRATOR**: Full administrative access including user and cluster management

### Role Configuration

**Important**: Spring Security automatically adds the `ROLE_` prefix internally. In configuration and annotations, roles are specified as:

- `USER` (not `ROLE_USER`)
- `ADMINISTRATOR` (not `ROLE_ADMINISTRATOR`)

**Example Configurations:**

```java
// Correct @PreAuthorize annotation format
@PreAuthorize("hasRole('USER') or hasRole('ADMINISTRATOR')")
@PreAuthorize("hasRole('ADMINISTRATOR')")

// Correct SecurityConfig format
.requestMatchers("/api/users/**").hasRole("ADMINISTRATOR")
.requestMatchers("/api/clusters/my/**").hasAnyRole("USER", "ADMINISTRATOR")
```

### Security Implementation Layers

#### 1. HTTP Security Configuration

Defined in `SecurityConfig.java`:

```java
.authorizeHttpRequests(authz -> authz
    // Admin-only endpoints
    .requestMatchers("/api/users/**").hasRole("ADMINISTRATOR")

    // Cluster endpoints use method-level security
    // Read operations: USER or ADMINISTRATOR
    // Write operations: ADMINISTRATOR only
    .requestMatchers("/api/clusters/**").authenticated()

    // RabbitMQ resource endpoints (authenticated users)
    .requestMatchers("/api/rabbitmq/**").authenticated()
)
```

#### 1.1. Mixed Reactive and Blocking Security Context

The application uses both reactive and blocking patterns for different endpoints, with proper error handling and authentication context maintained in both approaches:

**Reactive Pattern (for complex operations):**

```java
return resourceService.getVirtualHosts(clusterId, principal.getUser())
    .map(result -> {
        logger.debug("Successfully returned {} virtual hosts for cluster {}",
                    result.size(), clusterId);
        return ResponseEntity.ok(result);
    })
    .onErrorResume(error -> {
        logger.error("Failed to get virtual hosts for cluster {}: {}", clusterId,
                    error.getMessage());
        return Mono.just(ResponseEntity.status(500).<List<VirtualHostDto>>build());
    });
```

**Blocking Pattern (for simple proxy operations):**

```java
try {
    Object result = proxyService.get(clusterId, "/api/connections", Object.class, principal.getUser())
                    .block();
    return ResponseEntity.ok(result);
} catch (Exception error) {
    return handleErrorBlocking(error);
}
```

Both patterns ensure:

- Consistent error handling with proper HTTP status codes
- Authentication context is maintained throughout the processing
- Proper logging for both success and error scenarios
- Graceful error recovery with meaningful error responses

#### 2. Method-Level Security

Applied using `@PreAuthorize` annotations on controller methods:

```java
// Method-level authorization with differentiated access control
public class ClusterController {
    // Read operations allow both roles
    @PreAuthorize("hasRole('USER') or hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ClusterConnectionResponse>> getAllClusterConnections() {
        // Both USER and ADMINISTRATOR roles can view clusters
    }

    // Write operations require administrator role
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ClusterConnectionResponse> createClusterConnection() {
        // Only administrators can create clusters
    }
}

// Method-level authorization only
@PreAuthorize("hasRole('ADMINISTRATOR')")
public ResponseEntity<List<User>> getAllUsers() {
    // Only administrators can access this method
}
```

#### 3. Frontend Route Protection

Client-side route protection using React components:

- `ProtectedRoute`: Requires authentication
- `AdminRoute`: Requires administrator role

## Access Control Matrix

| Resource/Endpoint           | USER | ADMINISTRATOR | Notes                    |
| --------------------------- | ---- | ------------- | ------------------------ |
| **Authentication**          |
| Login/Logout                | ✅   | ✅            | Public endpoints         |
| Token Refresh               | ✅   | ✅            | Authenticated users      |
| **User Management**         |
| View Users                  | ❌   | ✅            | Admin only               |
| Create/Edit/Delete Users    | ❌   | ✅            | Admin only               |
| **Cluster Management**      |
| View All Clusters           | ✅   | ✅            | Both roles               |
| Create/Edit/Delete Clusters | ❌   | ✅            | Admin only               |
| View My Assigned Clusters   | ✅   | ✅            | Both roles               |
| **RabbitMQ Resources**      |
| View Resources              | ✅\* | ✅\*          | \*Only assigned clusters |
| Create/Delete Resources     | ✅\* | ✅\*          | \*Only assigned clusters |
| Publish/Consume Messages    | ✅\* | ✅\*          | \*Only assigned clusters |

## Cluster Access Control

### User-Cluster Assignment Model

- **Assignment Required**: Users can only access clusters they are explicitly assigned to
- **Administrator Override**: Administrators have access to all clusters regardless of assignment
- **Dynamic Assignment**: Cluster assignments can be modified by administrators
- **Active Clusters Only**: Only active cluster connections are accessible

### Assignment Validation

```java
// Cluster access validation in service layer
public void validateClusterAccess(UUID clusterId, UserPrincipal user) {
    if (user.hasRole("ADMINISTRATOR")) {
        return; // Administrators have access to all clusters
    }

    if (!isUserAssignedToCluster(user.getId(), clusterId)) {
        throw new AccessDeniedException("User not assigned to cluster");
    }
}
```

## Security Patterns

### Mixed Reactive and Blocking Context Propagation

The application uses both Spring WebFlux reactive programming and blocking patterns with explicit security context propagation:

#### Reactive Pattern Implementation

```java
// Standard reactive error handling pattern
return reactiveService.performOperation(params)
    .map(result -> {
        logger.debug("Operation successful: {}", result);
        return ResponseEntity.ok(result);
    })
    .onErrorResume(error -> {
        logger.error("Operation failed: {}", error.getMessage());
        return Mono.just(ResponseEntity.status(500).build());
    });
```

#### Blocking Pattern Implementation

```java
// Standard blocking error handling pattern
try {
    Object result = proxyService.performOperation(params).block();
    logger.debug("Operation successful: {}", result);
    return ResponseEntity.ok(result);
} catch (Exception error) {
    logger.error("Operation failed: {}", error.getMessage());
    return handleErrorBlocking(error);
}
```

#### When to Use Each Pattern

**Reactive Patterns:**

- **Complex Resource Operations**: When accessing RabbitMQ resources that require complex processing
- **Audit Logging**: When operations need comprehensive success and error logging
- **Authorization Checks**: When downstream services need to verify permissions
- **Cross-Service Calls**: When calling multiple services that require authentication context

**Blocking Patterns:**

- **Simple Proxy Operations**: When directly proxying requests to RabbitMQ Management API
- **Synchronous Operations**: When the operation is inherently synchronous
- **Legacy Integration**: When integrating with blocking APIs

#### Benefits

1. **Error Handling**: Consistent error responses with proper HTTP status codes in both patterns
2. **Flexibility**: Choose the appropriate pattern based on operation complexity
3. **Audit Trail**: Comprehensive logging for both success and error scenarios
4. **Authentication**: Maintains authentication context in both reactive and blocking operations

### Processing Lifecycle

#### Reactive Processing Lifecycle

1. **Request Arrival**: Security context established by JWT filter
2. **Controller Entry**: Context available via `@AuthenticationPrincipal`
3. **Service Layer**: Reactive processing with error handling
4. **Reactive Chain**: Proper error handling flows through all operators
5. **Response**: Context automatically cleaned up

#### Blocking Processing Lifecycle

1. **Request Arrival**: Security context established by JWT filter
2. **Controller Entry**: Context available via `@AuthenticationPrincipal`
3. **Service Layer**: Blocking call with `.block()` to convert reactive to synchronous
4. **Error Handling**: Try-catch blocks with consistent error mapping
5. **Response**: Context automatically cleaned up

## Security Best Practices

### Configuration Security

1. **JWT Secret**: Use strong, randomly generated secret keys
2. **Token Expiration**: Configure appropriate token lifetimes
3. **HTTPS Only**: Use HTTPS in production environments
4. **CORS Configuration**: Restrict CORS to trusted origins

### Security Annotation Best Practices

1. **Consistent Access Control**: Use class-level `@PreAuthorize` when all methods have the same security requirements
2. **Method-Level Granularity**: Use method-level annotations when different endpoints require different access levels (e.g., ClusterController with read/write differentiation)
3. **Avoid Redundancy**: Remove method-level annotations that duplicate class-level restrictions
4. **Clear Documentation**: Document access control patterns and any method-level overrides

### Application Security

1. **Input Validation**: All inputs validated server-side
2. **SQL Injection Prevention**: Use parameterized queries
3. **XSS Protection**: Content Security Policy headers
4. **Rate Limiting**: Prevent abuse with request rate limits
5. **Mixed Security Patterns**: Explicit context propagation for both reactive and blocking operations
6. **Security Annotation Hygiene**: Avoid redundant method-level annotations when class-level annotations provide the same protection

### Operational Security

1. **Audit Logging**: Log all security-relevant events with proper user context
2. **Regular Updates**: Keep dependencies updated
3. **Access Reviews**: Regular review of user assignments
4. **Monitoring**: Monitor for suspicious activity
5. **Context Validation**: Ensure security context is properly propagated

## Troubleshooting

### Common Security Issues

#### 1. Authentication Failures

**Symptoms**: 401 Unauthorized responses
**Causes**:

- Expired JWT tokens
- Invalid credentials
- Missing Authorization header

**Solutions**:

- Check token expiration
- Verify credentials
- Ensure proper header format: `Authorization: Bearer <token>`

#### 2. Authorization Failures

**Symptoms**: 403 Forbidden responses
**Causes**:

- Insufficient role permissions
- User not assigned to cluster
- Incorrect role configuration

**Solutions**:

- Verify user role assignments
- Check cluster assignments
- Review security configuration

#### 3. Role Configuration Issues

**Symptoms**: Unexpected access denials
**Causes**:

- Incorrect role prefix usage
- Mismatched role names
- Configuration inconsistencies

**Solutions**:

- Use correct role format (without `ROLE_` prefix)
- Ensure consistency across all security configurations
- Verify `@PreAuthorize` annotations

#### 4. Error Handling Issues

**Symptoms**: Inconsistent error responses, missing error logging, authentication context lost
**Causes**:

- Missing error handling in reactive chains (`onErrorResume()`)
- Missing error handling in blocking operations (try-catch)
- Incorrect error handling setup
- Thread boundary crossing without proper error handling

**Solutions**:

**For Reactive Operations:**

- Add proper error handling using `onErrorResume()`
- Verify authentication context is maintained through reactive operators
- Use consistent error response patterns

**For Blocking Operations:**

- Use try-catch blocks with proper error mapping
- Call `handleErrorBlocking()` for consistent error responses
- Ensure authentication context is available in catch blocks

**Example Fixes**:

```java
// Reactive - Before (inconsistent error handling)
return reactiveService.getData()
    .map(data -> processData(data)); // No error handling

// Reactive - After (proper error handling)
return reactiveService.getData()
    .map(result -> ResponseEntity.ok(result))
    .onErrorResume(error -> {
        logger.error("Operation failed: {}", error.getMessage());
        return Mono.just(ResponseEntity.status(500).build());
    });

// Blocking - Before (inconsistent error handling)
Object result = proxyService.getData().block();
return ResponseEntity.ok(result); // No error handling

// Blocking - After (proper error handling)
try {
    Object result = proxyService.getData().block();
    return ResponseEntity.ok(result);
} catch (Exception error) {
    return handleErrorBlocking(error);
}
```

### Debug Logging

Enable security debug logging for troubleshooting:

```yaml
logging:
  level:
    org.springframework.security: DEBUG
    com.rabbitmq.admin.security: DEBUG
    reactor.core: DEBUG # For reactive context debugging
```

## Migration Notes

### Role Prefix Changes

If migrating from systems that used explicit `ROLE_` prefixes:

1. **Remove Explicit Prefixes**: Change `ROLE_USER` to `USER`
2. **Update Annotations**: Ensure `@PreAuthorize` uses correct format
3. **Verify Configuration**: Check `SecurityConfig` role specifications
4. **Test Thoroughly**: Verify all access control scenarios

### Database Schema

User roles are stored in the database as:

- `USER`
- `ADMINISTRATOR`

No `ROLE_` prefix is stored in the database.

## Security Audit Checklist

- [ ] JWT secret key is strong and unique
- [ ] Token expiration is appropriately configured
- [ ] All endpoints have proper authorization
- [ ] Role assignments are correctly configured
- [ ] Cluster access validation is working
- [ ] Audit logging is enabled
- [ ] Rate limiting is configured
- [ ] HTTPS is enforced in production
- [ ] CORS is properly restricted
- [ ] Input validation is comprehensive
- [x] Mixed security patterns are implemented with proper error handling
- [x] Reactive endpoints use `onErrorResume()` for consistent error responses
- [x] Blocking endpoints use try-catch with `handleErrorBlocking()` for consistent error responses
- [x] Authentication context is maintained throughout both reactive and blocking processing chains
- [ ] Thread boundary crossing preserves authentication context

## Implementation Notes

### Recent Enhancements

**Cluster Management Access Control Enhancement** ✅ **COMPLETED**: Updated ClusterController to implement differentiated access control:

- **Read operations**: Now allow both USER and ADMINISTRATOR roles (previously admin-only)
- **Write operations**: Continue to require ADMINISTRATOR role only
- **Method-level security**: Replaced class-level `@PreAuthorize` with method-specific annotations for granular control

**Security Annotation Cleanup** ✅ **COMPLETED**: Removed redundant method-level `@PreAuthorize` annotations where class-level annotations already provide the same security requirements. This improves code maintainability while preserving the same security model.

**Mixed Security Context Propagation** ✅ **IMPLEMENTED**: Successfully implemented both reactive and blocking patterns throughout the application:

- **Reactive Pattern**: Used in complex operations like virtual hosts endpoint (`RabbitMQController.getVirtualHosts()`) using `Mono<ResponseEntity<List<VirtualHostDto>>>` return type with `onErrorResume()` for error handling
- **Blocking Pattern**: Used in simple proxy operations like connections endpoint (`RabbitMQController.getConnections()`) using `ResponseEntity<Object>` return type with try-catch blocks and `handleErrorBlocking()` for error handling

Both approaches provide consistent error responses while maintaining proper authentication context throughout the processing chain. This hybrid approach ensures reliable error handling and maintains security context in both reactive and blocking operations, choosing the most appropriate pattern based on operation complexity.

This security model provides comprehensive protection while maintaining usability and clear role separation between regular users and administrators, with full support for both reactive and blocking programming patterns.
