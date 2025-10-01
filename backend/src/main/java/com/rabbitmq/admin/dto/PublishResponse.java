package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for RabbitMQ message publish response.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PublishResponse {

    @JsonProperty("routed")
    private Boolean routed;

    public PublishResponse() {
    }

    public PublishResponse(Boolean routed) {
        this.routed = routed;
    }

    public Boolean getRouted() {
        return routed;
    }

    public void setRouted(Boolean routed) {
        this.routed = routed;
    }
}