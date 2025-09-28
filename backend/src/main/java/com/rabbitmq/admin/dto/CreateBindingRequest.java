package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO for creating a new RabbitMQ binding.
 */
public class CreateBindingRequest {

    @Size(max = 255, message = "Routing key must not exceed 255 characters")
    private String routingKey = "";

    private Map<String, Object> arguments = new HashMap<>();

    public CreateBindingRequest() {
    }

    public CreateBindingRequest(String routingKey, Map<String, Object> arguments) {
        this.routingKey = routingKey != null ? routingKey : "";
        this.arguments = arguments != null ? arguments : new HashMap<>();
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey != null ? routingKey : "";
    }

    public Map<String, Object> getArguments() {
        return arguments;
    }

    public void setArguments(Map<String, Object> arguments) {
        this.arguments = arguments != null ? arguments : new HashMap<>();
    }
}