package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO for RabbitMQ message information in API responses.
 * Uses camelCase field names for frontend compatibility.
 */
public class MessageResponseDto {

    @JsonProperty("payloadEncoding")
    private String payloadEncoding;

    @JsonProperty("payload")
    private String payload;

    @JsonProperty("properties")
    private Map<String, Object> properties;

    @JsonProperty("routingKey")
    private String routingKey;

    @JsonProperty("redelivered")
    private Boolean redelivered;

    @JsonProperty("exchange")
    private String exchange;

    @JsonProperty("messageCount")
    private Integer messageCount;

    public MessageResponseDto() {
    }

    public MessageResponseDto(String payloadEncoding, String payload, Map<String, Object> properties,
            String routingKey, Boolean redelivered, String exchange, Integer messageCount) {
        this.payloadEncoding = payloadEncoding;
        this.payload = payload;
        this.properties = properties;
        this.routingKey = routingKey;
        this.redelivered = redelivered;
        this.exchange = exchange;
        this.messageCount = messageCount;
    }

    // Static factory method to convert from MessageDto
    public static MessageResponseDto fromMessageDto(MessageDto messageDto) {
        return new MessageResponseDto(
                messageDto.getPayloadEncoding(),
                messageDto.getPayload(),
                messageDto.getProperties(),
                messageDto.getRoutingKey(),
                messageDto.getRedelivered(),
                messageDto.getExchange(),
                messageDto.getMessageCount());
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