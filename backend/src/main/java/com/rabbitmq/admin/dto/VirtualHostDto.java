package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * DTO for RabbitMQ virtual host information.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class VirtualHostDto {

    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    @JsonProperty("tags")
    private List<String> tags;

    @JsonProperty("default_queue_type")
    private String defaultQueueType;

    @JsonProperty("tracing")
    private Boolean tracing;

    @JsonProperty("message_stats")
    private Map<String, Object> messageStats;

    public VirtualHostDto() {
    }

    public VirtualHostDto(String name, String description, List<String> tags, String defaultQueueType,
            Boolean tracing, Map<String, Object> messageStats) {
        this.name = name;
        this.description = description;
        this.tags = tags;
        this.defaultQueueType = defaultQueueType;
        this.tracing = tracing;
        this.messageStats = messageStats;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getDefaultQueueType() {
        return defaultQueueType;
    }

    public void setDefaultQueueType(String defaultQueueType) {
        this.defaultQueueType = defaultQueueType;
    }

    public Boolean getTracing() {
        return tracing;
    }

    public void setTracing(Boolean tracing) {
        this.tracing = tracing;
    }

    public Map<String, Object> getMessageStats() {
        return messageStats;
    }

    public void setMessageStats(Map<String, Object> messageStats) {
        this.messageStats = messageStats;
    }
}