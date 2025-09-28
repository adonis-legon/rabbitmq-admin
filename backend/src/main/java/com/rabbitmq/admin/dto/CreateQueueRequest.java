package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO for creating a new RabbitMQ queue.
 */
public class CreateQueueRequest {

    @NotBlank(message = "Queue name is required")
    @Size(min = 1, max = 255, message = "Queue name must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Queue name can only contain letters, numbers, dots, underscores, and hyphens")
    private String name;

    @NotBlank(message = "Virtual host is required")
    private String vhost;

    @NotNull(message = "Durable flag is required")
    private Boolean durable = true;

    @NotNull(message = "Auto-delete flag is required")
    private Boolean autoDelete = false;

    @NotNull(message = "Exclusive flag is required")
    private Boolean exclusive = false;

    private Map<String, Object> arguments = new HashMap<>();

    @Size(max = 255, message = "Node name must not exceed 255 characters")
    private String node;

    public CreateQueueRequest() {
    }

    public CreateQueueRequest(String name, String vhost, Boolean durable, Boolean autoDelete,
            Boolean exclusive, Map<String, Object> arguments, String node) {
        this.name = name;
        this.vhost = vhost;
        this.durable = durable;
        this.autoDelete = autoDelete;
        this.exclusive = exclusive;
        this.arguments = arguments != null ? arguments : new HashMap<>();
        this.node = node;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Boolean getExclusive() {
        return exclusive;
    }

    public void setExclusive(Boolean exclusive) {
        this.exclusive = exclusive;
    }

    public Map<String, Object> getArguments() {
        return arguments;
    }

    public void setArguments(Map<String, Object> arguments) {
        this.arguments = arguments != null ? arguments : new HashMap<>();
    }

    public String getNode() {
        return node;
    }

    public void setNode(String node) {
        this.node = node;
    }
}