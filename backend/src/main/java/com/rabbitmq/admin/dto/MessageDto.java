package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO for RabbitMQ message information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MessageDto {

    @JsonProperty("payload_encoding")
    private String payloadEncoding;

    @JsonProperty("payload")
    private String payload;

    @JsonProperty("properties")
    private Map<String, Object> properties;

    @JsonProperty("routing_key")
    private String routingKey;

    @JsonProperty("redelivered")
    private Boolean redelivered;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("message_count")
    private Integer messageCount;

    public MessageDto() {
    }

    public MessageDto(String payloadEncoding, String payload, Map<String, Object> properties,
            String routingKey, Boolean redelivered, String exchange, Integer messageCount) {
        this.payloadEncoding = payloadEncoding;
        this.payload = payload;
        this.properties = properties;
        this.routingKey = routingKey;
        this.redelivered = redelivered;
        this.exchange = exchange;
        this.messageCount = messageCount;
    }

    public String getPayloadEncoding() {
        return payloadEncoding;
    }

    public void setPayloadEncoding(String payloadEncoding) {
        this.payloadEncoding = payloadEncoding;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey;
    }

    public Boolean getRedelivered() {
        return redelivered;
    }

    public void setRedelivered(Boolean redelivered) {
        this.redelivered = redelivered;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public Integer getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(Integer messageCount) {
        this.messageCount = messageCount;
    }
}