package com.rabbitmq.admin.exception;

import com.rabbitmq.admin.service.RabbitMQResourceService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for consistent error responses across the
 * application.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {

        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");
        response.put("message", "Input validation failed");
        response.put("path", request.getDescription(false).replace("uri=", ""));
        response.put("details", errors);

        logger.warn("Validation error: {}", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle constraint violation errors (e.g., @Min, @Max validation on controller
     * parameters)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(
            ConstraintViolationException ex, WebRequest request) {

        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();

        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String propertyPath = violation.getPropertyPath().toString();
            String message = violation.getMessage();
            errors.put(propertyPath, message);
        }

        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");
        response.put("message", "Parameter validation failed");
        response.put("path", request.getDescription(false).replace("uri=", ""));
        response.put("details", errors);

        logger.warn("Constraint violation error: {}", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle RabbitMQ resource exceptions
     */
    @ExceptionHandler(RabbitMQResourceService.RabbitMQResourceException.class)
    public ResponseEntity<Map<String, Object>> handleRabbitMQResourceException(
            RabbitMQResourceService.RabbitMQResourceException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_GATEWAY, "RabbitMQ Resource Error", ex.getMessage(), request);

        logger.warn("RabbitMQ resource error: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_GATEWAY);
    }

    /**
     * Handle authentication errors
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.UNAUTHORIZED.value());
        response.put("error", "Unauthorized");
        response.put("message", ex.getMessage());
        response.put("path", request.getDescription(false).replace("uri=", ""));

        logger.warn("Authentication error: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handle user not found errors
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameNotFoundException(
            UsernameNotFoundException ex, WebRequest request) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.UNAUTHORIZED.value());
        response.put("error", "Unauthorized");
        response.put("message", "Invalid credentials");
        response.put("path", request.getDescription(false).replace("uri=", ""));

        logger.warn("User not found: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Bad Request");
        response.put("message", ex.getMessage());
        response.put("path", request.getDescription(false).replace("uri=", ""));

        logger.warn("Illegal argument: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle generic runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex, WebRequest request) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("error", "Internal Server Error");
        response.put("message", "An unexpected error occurred");
        response.put("path", request.getDescription(false).replace("uri=", ""));

        logger.error("Runtime exception: ", ex);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handle user not found exceptions
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(
            UserNotFoundException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.NOT_FOUND, "User Not Found", ex.getMessage(), request);

        logger.warn("User not found: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle cluster connection not found exceptions
     */
    @ExceptionHandler(ClusterConnectionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleClusterConnectionNotFoundException(
            ClusterConnectionNotFoundException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.NOT_FOUND, "Cluster Connection Not Found", ex.getMessage(), request);

        logger.warn("Cluster connection not found: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle duplicate resource exceptions
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateResourceException(
            DuplicateResourceException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.CONFLICT, "Resource Already Exists", ex.getMessage(), request);

        if (ex.getResourceType() != null && ex.getResourceIdentifier() != null) {
            Map<String, String> details = new HashMap<>();
            details.put("resourceType", ex.getResourceType());
            details.put("resourceIdentifier", ex.getResourceIdentifier());
            response.put("details", details);
        }

        logger.warn("Duplicate resource: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * Handle validation exceptions
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            ValidationException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST, "Validation Failed", ex.getMessage(), request);

        if (!ex.getFieldErrors().isEmpty()) {
            response.put("details", ex.getFieldErrors());
        }

        logger.warn("Validation error: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle cluster connection exceptions
     */
    @ExceptionHandler(ClusterConnectionException.class)
    public ResponseEntity<Map<String, Object>> handleClusterConnectionException(
            ClusterConnectionException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST, "Cluster Connection Error", ex.getMessage(), request);

        if (ex.getClusterId() != null) {
            Map<String, String> details = new HashMap<>();
            details.put("clusterId", ex.getClusterId());
            response.put("details", details);
        }

        logger.warn("Cluster connection error: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle RabbitMQ API exceptions
     */
    @ExceptionHandler(RabbitMQApiException.class)
    public ResponseEntity<Map<String, Object>> handleRabbitMQApiException(
            RabbitMQApiException ex, WebRequest request) {

        HttpStatus status = mapRabbitMQStatusCode(ex.getStatusCode());
        Map<String, Object> response = createErrorResponse(
                status, "RabbitMQ API Error", ex.getMessage(), request);

        Map<String, Object> details = new HashMap<>();
        details.put("clusterId", ex.getClusterId());
        if (ex.getStatusCode() > 0) {
            details.put("rabbitMQStatusCode", ex.getStatusCode());
        }
        response.put("details", details);

        logger.warn("RabbitMQ API error: {} (cluster: {}, status: {})",
                ex.getMessage(), ex.getClusterId(), ex.getStatusCode());
        return new ResponseEntity<>(response, status);
    }

    /**
     * Handle access denied exceptions
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.FORBIDDEN, "Access Denied", ex.getMessage(), request);

        logger.warn("Access denied: {}", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle method argument type mismatch exceptions
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, WebRequest request) {

        Class<?> requiredType = ex.getRequiredType();
        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(), ex.getName(),
                requiredType != null ? requiredType.getSimpleName() : "unknown");

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST, "Invalid Parameter", message, request);
        Map<String, Object> details = new HashMap<>();
        details.put("parameter", ex.getName());
        details.put("rejectedValue", ex.getValue());
        details.put("expectedType", requiredType != null ? requiredType.getSimpleName() : "unknown");
        response.put("details", details);

        logger.warn("Method argument type mismatch: {}", message);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
            Exception ex, WebRequest request) {

        Map<String, Object> response = createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "An unexpected error occurred", request);

        logger.error("Unexpected exception: ", ex);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Create a standardized error response
     */
    private Map<String, Object> createErrorResponse(HttpStatus status, String error,
            String message, WebRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", status.value());
        response.put("error", error);
        response.put("message", message);
        response.put("path", request.getDescription(false).replace("uri=", ""));
        return response;
    }

    /**
     * Map RabbitMQ API status codes to HTTP status codes
     */
    private HttpStatus mapRabbitMQStatusCode(int rabbitMQStatusCode) {
        return switch (rabbitMQStatusCode) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 409 -> HttpStatus.CONFLICT;
            case 422 -> HttpStatus.UNPROCESSABLE_ENTITY;
            case 500 -> HttpStatus.INTERNAL_SERVER_ERROR;
            case 502 -> HttpStatus.BAD_GATEWAY;
            case 503 -> HttpStatus.SERVICE_UNAVAILABLE;
            default -> HttpStatus.BAD_GATEWAY;
        };
    }
}