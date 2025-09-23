package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO for RabbitMQ channel information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChannelDto {

    @JsonProperty("name")
    private String name;

    @JsonProperty("number")
    private Integer number;

    @JsonProperty("state")
    private String state;

    @JsonProperty("consumer_count")
    private Integer consumerCount;

    @JsonProperty("messages_unacknowledged")
    private Integer messagesUnacknowledged;

    @JsonProperty("messages_unconfirmed")
    private Integer messagesUnconfirmed;

    @JsonProperty("messages_uncommitted")
    private Integer messagesUncommitted;

    @JsonProperty("acks_uncommitted")
    private Integer acksUncommitted;

    @JsonProperty("prefetch_count")
    private Integer prefetchCount;

    @JsonProperty("global_prefetch_count")
    private Integer globalPrefetchCount;

    @JsonProperty("transactional")
    private Boolean transactional;

    @JsonProperty("confirm")
    private Boolean confirm;

    @JsonProperty("user")
    private String user;

    @JsonProperty("vhost")
    private String vhost;

    @JsonProperty("connection_details")
    private Map<String, Object> connectionDetails;

    public ChannelDto() {
    }

    public ChannelDto(String name, Integer number, String state, Integer consumerCount,
            Integer messagesUnacknowledged, Integer prefetchCount, Boolean transactional,
            Boolean confirm, String user, String vhost) {
        this.name = name;
        this.number = number;
        this.state = state;
        this.consumerCount = consumerCount;
        this.messagesUnacknowledged = messagesUnacknowledged;
        this.prefetchCount = prefetchCount;
        this.transactional = transactional;
        this.confirm = confirm;
        this.user = user;
        this.vhost = vhost;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getNumber() {
        return number;
    }

    public void setNumber(Integer number) {
        this.number = number;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Integer getConsumerCount() {
        return consumerCount;
    }

    public void setConsumerCount(Integer consumerCount) {
        this.consumerCount = consumerCount;
    }

    public Integer getMessagesUnacknowledged() {
        return messagesUnacknowledged;
    }

    public void setMessagesUnacknowledged(Integer messagesUnacknowledged) {
        this.messagesUnacknowledged = messagesUnacknowledged;
    }

    public Integer getMessagesUnconfirmed() {
        return messagesUnconfirmed;
    }

    public void setMessagesUnconfirmed(Integer messagesUnconfirmed) {
        this.messagesUnconfirmed = messagesUnconfirmed;
    }

    public Integer getMessagesUncommitted() {
        return messagesUncommitted;
    }

    public void setMessagesUncommitted(Integer messagesUncommitted) {
        this.messagesUncommitted = messagesUncommitted;
    }

    public Integer getAcksUncommitted() {
        return acksUncommitted;
    }

    public void setAcksUncommitted(Integer acksUncommitted) {
        this.acksUncommitted = acksUncommitted;
    }

    public Integer getPrefetchCount() {
        return prefetchCount;
    }

    public void setPrefetchCount(Integer prefetchCount) {
        this.prefetchCount = prefetchCount;
    }

    public Integer getGlobalPrefetchCount() {
        return globalPrefetchCount;
    }

    public void setGlobalPrefetchCount(Integer globalPrefetchCount) {
        this.globalPrefetchCount = globalPrefetchCount;
    }

    public Boolean getTransactional() {
        return transactional;
    }

    public void setTransactional(Boolean transactional) {
        this.transactional = transactional;
    }

    public Boolean getConfirm() {
        return confirm;
    }

    public void setConfirm(Boolean confirm) {
        this.confirm = confirm;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getVhost() {
        return vhost;
    }

    public void setVhost(String vhost) {
        this.vhost = vhost;
    }

    public Map<String, Object> getConnectionDetails() {
        return connectionDetails;
    }

    public void setConnectionDetails(Map<String, Object> connectionDetails) {
        this.connectionDetails = connectionDetails;
    }
}