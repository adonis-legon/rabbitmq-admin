package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO for RabbitMQ exchange information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExchangeDto {

    @JsonProperty("name")
    private String name;

    @JsonProperty("type")
    private String type;

    @JsonProperty("durable")
    private Boolean durable;

    @JsonProperty("auto_delete")
    private Boolean autoDelete;

    @JsonProperty("internal")
    private Boolean internal;

    @JsonProperty("arguments")
    private Map<String, Object> arguments;

    @JsonProperty("vhost")
    private String vhost;

    @JsonProperty("message_stats")
    private Map<String, Object> messageStats;

    public ExchangeDto() {
    }

    public ExchangeDto(String name, String type, Boolean durable, Boolean autoDelete,
            Boolean internal, Map<String, Object> arguments, String vhost) {
        this.name = name;
        this.type = type;
        this.durable = durable;
        this.autoDelete = autoDelete;
        this.internal = internal;
        this.arguments = arguments;
        this.vhost = vhost;
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
        this.arguments = arguments;
    }

    public String getVhost() {
        return vhost;
    }

    public void setVhost(String vhost) {
        this.vhost = vhost;
    }

    public Map<String, Object> getMessageStats() {
        return messageStats;
    }

    public void setMessageStats(Map<String, Object> messageStats) {
        this.messageStats = messageStats;
    }
}