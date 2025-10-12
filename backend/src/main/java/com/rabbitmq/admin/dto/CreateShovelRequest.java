package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a RabbitMQ shovel to move messages from one queue to
 * another.
 */
public class CreateShovelRequest {

    @NotBlank(message = "Shovel name is required")
    @Size(min = 1, max = 255, message = "Shovel name must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Shovel name can only contain letters, numbers, dots, underscores, and hyphens")
    private String name;

    @NotBlank(message = "Virtual host is required")
    private String vhost;

    @NotBlank(message = "Source queue is required")
    private String sourceQueue;

    @NotBlank(message = "Destination queue is required")
    private String destinationQueue;

    private String sourceUri = "amqp://localhost";

    private String destinationUri = "amqp://localhost";

    @NotNull(message = "Delete after is required")
    @Pattern(regexp = "^(queue-length|never)$", message = "Delete after must be either 'queue-length' or 'never'")
    private String deleteAfter = "queue-length";

    @NotNull(message = "Acknowledge mode is required")
    @Pattern(regexp = "^(on-confirm|on-publish|no-ack)$", message = "Acknowledge mode must be one of: on-confirm, on-publish, no-ack")
    private String ackMode = "on-confirm";

    /**
     * The number of messages in the source queue at the time of shovel creation.
     * This is used for audit tracking purposes.
     */
    private Integer sourceQueueMessageCount;

    public CreateShovelRequest() {
    }

    public CreateShovelRequest(String name, String vhost, String sourceQueue, String destinationQueue,
            String sourceUri, String destinationUri, String deleteAfter, String ackMode) {
        this.name = name;
        this.vhost = vhost;
        this.sourceQueue = sourceQueue;
        this.destinationQueue = destinationQueue;
        this.sourceUri = sourceUri;
        this.destinationUri = destinationUri;
        this.deleteAfter = deleteAfter;
        this.ackMode = ackMode;
    }

    // Getters and setters
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

    public String getSourceQueue() {
        return sourceQueue;
    }

    public void setSourceQueue(String sourceQueue) {
        this.sourceQueue = sourceQueue;
    }

    public String getDestinationQueue() {
        return destinationQueue;
    }

    public void setDestinationQueue(String destinationQueue) {
        this.destinationQueue = destinationQueue;
    }

    public String getSourceUri() {
        return sourceUri;
    }

    public void setSourceUri(String sourceUri) {
        this.sourceUri = sourceUri;
    }

    public String getDestinationUri() {
        return destinationUri;
    }

    public void setDestinationUri(String destinationUri) {
        this.destinationUri = destinationUri;
    }

    public String getDeleteAfter() {
        return deleteAfter;
    }

    public void setDeleteAfter(String deleteAfter) {
        this.deleteAfter = deleteAfter;
    }

    public String getAckMode() {
        return ackMode;
    }

    public void setAckMode(String ackMode) {
        this.ackMode = ackMode;
    }

    public Integer getSourceQueueMessageCount() {
        return sourceQueueMessageCount;
    }

    public void setSourceQueueMessageCount(Integer sourceQueueMessageCount) {
        this.sourceQueueMessageCount = sourceQueueMessageCount;
    }

    @Override
    public String toString() {
        return "CreateShovelRequest{" +
                "name='" + name + '\'' +
                ", vhost='" + vhost + '\'' +
                ", sourceQueue='" + sourceQueue + '\'' +
                ", destinationQueue='" + destinationQueue + '\'' +
                ", sourceUri='" + sourceUri + '\'' +
                ", destinationUri='" + destinationUri + '\'' +
                ", deleteAfter='" + deleteAfter + '\'' +
                ", ackMode='" + ackMode + '\'' +
                ", sourceQueueMessageCount=" + sourceQueueMessageCount +
                '}';
    }
}