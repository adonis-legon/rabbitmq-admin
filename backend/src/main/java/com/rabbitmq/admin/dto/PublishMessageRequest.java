package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO for publishing a message to RabbitMQ.
 */
public class PublishMessageRequest {

    @Size(max = 255, message = "Routing key must not exceed 255 characters")
    private String routingKey = "";

    private Map<String, Object> properties = new HashMap<>();

    @NotNull(message = "Payload is required")
    @Size(max = 1048576, message = "Payload must not exceed 1MB")
    private String payload;

    @Pattern(regexp = "^(string|base64)$", message = "Payload encoding must be either 'string' or 'base64'")
    private String payloadEncoding = "string";

    public PublishMessageRequest() {
    }

    public PublishMessageRequest(String routingKey, Map<String, Object> properties,
            String payload, String payloadEncoding) {
        this.routingKey = routingKey != null ? routingKey : "";
        this.properties = properties != null ? properties : new HashMap<>();
        this.payload = payload;
        this.payloadEncoding = payloadEncoding != null ? payloadEncoding : "string";
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey != null ? routingKey : "";
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties != null ? properties : new HashMap<>();
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public String getPayloadEncoding() {
        return payloadEncoding;
    }

    public void setPayloadEncoding(String payloadEncoding) {
        this.payloadEncoding = payloadEncoding != null ? payloadEncoding : "string";
    }
}