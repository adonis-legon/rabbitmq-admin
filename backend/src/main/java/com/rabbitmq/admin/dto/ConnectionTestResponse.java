package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for connection test results.
 */
public class ConnectionTestResponse {

    @JsonProperty("successful")
    private boolean successful;
    private String message;
    private String errorDetails;
    private long responseTimeMs;

    public ConnectionTestResponse() {
    }

    public ConnectionTestResponse(boolean successful, String message) {
        this.successful = successful;
        this.message = message;
    }

    public ConnectionTestResponse(boolean successful, String message, String errorDetails, long responseTimeMs) {
        this.successful = successful;
        this.message = message;
        this.errorDetails = errorDetails;
        this.responseTimeMs = responseTimeMs;
    }

    public static ConnectionTestResponse success(String message, long responseTimeMs) {
        return new ConnectionTestResponse(true, message, null, responseTimeMs);
    }

    public static ConnectionTestResponse failure(String message, String errorDetails) {
        return new ConnectionTestResponse(false, message, errorDetails, 0);
    }

    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getErrorDetails() {
        return errorDetails;
    }

    public void setErrorDetails(String errorDetails) {
        this.errorDetails = errorDetails;
    }

    public long getResponseTimeMs() {
        return responseTimeMs;
    }

    public void setResponseTimeMs(long responseTimeMs) {
        this.responseTimeMs = responseTimeMs;
    }
}