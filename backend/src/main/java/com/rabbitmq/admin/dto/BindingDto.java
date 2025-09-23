package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO for RabbitMQ binding information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BindingDto {

    @JsonProperty("source")
    private String source;

    @JsonProperty("destination")
    private String destination;

    @JsonProperty("destination_type")
    private String destinationType;

    @JsonProperty("routing_key")
    private String routingKey;

    @JsonProperty("arguments")
    private Map<String, Object> arguments;

    @JsonProperty("properties_key")
    private String propertiesKey;

    @JsonProperty("vhost")
    private String vhost;

    public BindingDto() {
    }

    public BindingDto(String source, String destination, String destinationType,
            String routingKey, Map<String, Object> arguments, String vhost) {
        this.source = source;
        this.destination = destination;
        this.destinationType = destinationType;
        this.routingKey = routingKey;
        this.arguments = arguments;
        this.vhost = vhost;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDestinationType() {
        return destinationType;
    }

    public void setDestinationType(String destinationType) {
        this.destinationType = destinationType;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey;
    }

    public Map<String, Object> getArguments() {
        return arguments;
    }

    public void setArguments(Map<String, Object> arguments) {
        this.arguments = arguments;
    }

    public String getPropertiesKey() {
        return propertiesKey;
    }

    public void setPropertiesKey(String propertiesKey) {
        this.propertiesKey = propertiesKey;
    }

    public String getVhost() {
        return vhost;
    }

    public void setVhost(String vhost) {
        this.vhost = vhost;
    }
}