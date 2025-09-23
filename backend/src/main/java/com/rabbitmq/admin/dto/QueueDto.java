package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * DTO for RabbitMQ queue information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class QueueDto {

    @JsonProperty("name")
    private String name;

    @JsonProperty("state")
    private String state;

    @JsonProperty("durable")
    private Boolean durable;

    @JsonProperty("auto_delete")
    private Boolean autoDelete;

    @JsonProperty("exclusive")
    private Boolean exclusive;

    @JsonProperty("arguments")
    private Map<String, Object> arguments;

    @JsonProperty("node")
    private String node;

    @JsonProperty("vhost")
    private String vhost;

    @JsonProperty("messages")
    private Integer messages;

    @JsonProperty("messages_ready")
    private Integer messagesReady;

    @JsonProperty("messages_unacknowledged")
    private Integer messagesUnacknowledged;

    @JsonProperty("consumers")
    private Integer consumers;

    @JsonProperty("consumer_utilisation")
    private Double consumerUtilisation;

    @JsonProperty("memory")
    private Long memory;

    @JsonProperty("message_stats")
    private Map<String, Object> messageStats;

    @JsonProperty("consumer_details")
    private List<Map<String, Object>> consumerDetails;

    public QueueDto() {
    }

    public QueueDto(String name, String state, Boolean durable, Boolean autoDelete,
            Boolean exclusive, Map<String, Object> arguments, String node,
            String vhost, Integer messages, Integer consumers) {
        this.name = name;
        this.state = state;
        this.durable = durable;
        this.autoDelete = autoDelete;
        this.exclusive = exclusive;
        this.arguments = arguments;
        this.node = node;
        this.vhost = vhost;
        this.messages = messages;
        this.consumers = consumers;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
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
        this.arguments = arguments;
    }

    public String getNode() {
        return node;
    }

    public void setNode(String node) {
        this.node = node;
    }

    public String getVhost() {
        return vhost;
    }

    public void setVhost(String vhost) {
        this.vhost = vhost;
    }

    public Integer getMessages() {
        return messages;
    }

    public void setMessages(Integer messages) {
        this.messages = messages;
    }

    public Integer getMessagesReady() {
        return messagesReady;
    }

    public void setMessagesReady(Integer messagesReady) {
        this.messagesReady = messagesReady;
    }

    public Integer getMessagesUnacknowledged() {
        return messagesUnacknowledged;
    }

    public void setMessagesUnacknowledged(Integer messagesUnacknowledged) {
        this.messagesUnacknowledged = messagesUnacknowledged;
    }

    public Integer getConsumers() {
        return consumers;
    }

    public void setConsumers(Integer consumers) {
        this.consumers = consumers;
    }

    public Double getConsumerUtilisation() {
        return consumerUtilisation;
    }

    public void setConsumerUtilisation(Double consumerUtilisation) {
        this.consumerUtilisation = consumerUtilisation;
    }

    public Long getMemory() {
        return memory;
    }

    public void setMemory(Long memory) {
        this.memory = memory;
    }

    public Map<String, Object> getMessageStats() {
        return messageStats;
    }

    public void setMessageStats(Map<String, Object> messageStats) {
        this.messageStats = messageStats;
    }

    public List<Map<String, Object>> getConsumerDetails() {
        return consumerDetails;
    }

    public void setConsumerDetails(List<Map<String, Object>> consumerDetails) {
        this.consumerDetails = consumerDetails;
    }
}