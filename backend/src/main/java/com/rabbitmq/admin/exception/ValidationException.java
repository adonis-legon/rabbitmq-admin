package com.rabbitmq.admin.exception;

import java.util.Map;
import java.util.HashMap;

/**
 * Exception thrown when validation fails for business rules.
 */
public class ValidationException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public ValidationException(String message) {
        super(message);
        this.fieldErrors = new HashMap<>();
    }

    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors != null ? fieldErrors : new HashMap<>();
    }

    public ValidationException(String field, String error) {
        super("Validation failed");
        this.fieldErrors = new HashMap<>();
        this.fieldErrors.put(field, error);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    public static ValidationException passwordStrength() {
        return new ValidationException("password",
                "Password must be at least 8 characters long and contain at least one uppercase letter, " +
                        "one lowercase letter, one number, and one special character (@$!%*?&)");
    }

    public static ValidationException invalidUrl(String url) {
        return new ValidationException("apiUrl", "Invalid API URL format: " + url);
    }

    public static ValidationException emptyField(String fieldName) {
        return new ValidationException(fieldName, fieldName + " cannot be empty");
    }
}