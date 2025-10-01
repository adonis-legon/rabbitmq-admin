package com.rabbitmq.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for retrieving messages from a RabbitMQ queue.
 */
public class GetMessagesRequest {

    @Min(value = 1, message = "Message count must be at least 1")
    @Max(value = 100, message = "Message count must not exceed 100")
    private Integer count = 1;

    @Pattern(regexp = "^(ack_requeue_true|ack_requeue_false|reject_requeue_true|reject_requeue_false)$", message = "Acknowledgment mode must be one of: ack_requeue_true, ack_requeue_false, reject_requeue_true, reject_requeue_false")
    private String ackmode = "ack_requeue_true";

    @Pattern(regexp = "^(auto|base64)$", message = "Encoding must be either 'auto' or 'base64'")
    private String encoding = "auto";

    @Min(value = 1, message = "Truncate value must be at least 1")
    @Max(value = 1048576, message = "Truncate value must not exceed 1MB")
    private Integer truncate;

    public GetMessagesRequest() {
    }

    public GetMessagesRequest(Integer count, String ackmode, String encoding, Integer truncate) {
        this.count = count != null ? count : 1;
        this.ackmode = ackmode != null ? ackmode : "ack_requeue_true";
        this.encoding = encoding != null ? encoding : "auto";
        this.truncate = truncate;
    }

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count != null ? count : 1;
    }

    public String getAckmode() {
        return ackmode;
    }

    public void setAckmode(String ackmode) {
        this.ackmode = ackmode != null ? ackmode : "ack_requeue_true";
    }

    public String getEncoding() {
        return encoding;
    }

    public void setEncoding(String encoding) {
        this.encoding = encoding != null ? encoding : "auto";
    }

    public Integer getTruncate() {
        return truncate;
    }

    public void setTruncate(Integer truncate) {
        this.truncate = truncate;
    }
}