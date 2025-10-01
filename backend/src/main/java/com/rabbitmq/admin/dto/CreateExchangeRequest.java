package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO for creating a new RabbitMQ exchange.
 */
public class CreateExchangeRequest {

    @NotBlank(message = "Exchange name is required")
    @Size(min = 1, max = 255, message = "Exchange name must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Exchange name can only contain letters, numbers, dots, underscores, and hyphens")
    private String name;

    @NotBlank(message = "Exchange type is required")
    @Pattern(regexp = "^(direct|fanout|topic|headers)$", message = "Exchange type must be one of: direct, fanout, topic, headers")
    private String type;

    @NotBlank(message = "Virtual host is required")
    private String vhost;

    @NotNull(message = "Durable flag is required")
    private Boolean durable = true;

    @NotNull(message = "Auto-delete flag is required")
    private Boolean autoDelete = false;

    @NotNull(message = "Internal flag is required")
    private Boolean internal = false;

    private Map<String, Object> arguments = new HashMap<>();

    public CreateExchangeRequest() {
    }

    public CreateExchangeRequest(String name, String type, String vhost, Boolean durable,
            Boolean autoDelete, Boolean internal, Map<String, Object> arguments) {
        this.name = name;
        this.type = type;
        this.vhost = vhost;
        this.durable = durable;
        this.autoDelete = autoDelete;
        this.internal = internal;
        this.arguments = arguments != null ? arguments : new HashMap<>();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getVhost() {
        return vhost;
    }

    public void setVhost(String vhost) {
        this.vhost = vhost;
    }

    public Boolean getDurable() {
        return durable;
    }

    public void setDurable(Boolean durable) {
        this.durable = durable;
    }

    public Boolean getAutoDelete() {
        return autoDelete;
    }

    public void setAutoDelete(Boolean autoDelete) {
        this.autoDelete = autoDelete;
    }

    public Boolean getInternal() {
        return internal;
    }

    public void setInternal(Boolean internal) {
        this.internal = internal;
    }

    public Map<String, Object> getArguments() {
        return arguments;
    }

    public void setArguments(Map<String, Object> arguments) {
        this.arguments = arguments != null ? arguments : new HashMap<>();
    }
}