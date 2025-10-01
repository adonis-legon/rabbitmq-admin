package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PublishResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        PublishResponse response = new PublishResponse();

        assertNull(response.getRouted());
    }

    @Test
    void testConstructorWithParameter() {
        PublishResponse response = new PublishResponse(true);

        assertTrue(response.getRouted());
    }

    @Test
    void testSettersAndGetters() {
        PublishResponse response = new PublishResponse();

        response.setRouted(true);
        assertTrue(response.getRouted());

        response.setRouted(false);
        assertFalse(response.getRouted());

        response.setRouted(null);
        assertNull(response.getRouted());
    }

    @Test
    void testJsonSerialization() throws Exception {
        PublishResponse response = new PublishResponse(true);

        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"routed\":true"));
    }

    @Test
    void testJsonSerializationFalse() throws Exception {
        PublishResponse response = new PublishResponse(false);

        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"routed\":false"));
    }

    @Test
    void testJsonSerializationNull() throws Exception {
        PublishResponse response = new PublishResponse();

        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"routed\":null"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{\"routed\":true}";

        PublishResponse response = objectMapper.readValue(json, PublishResponse.class);

        assertTrue(response.getRouted());
    }

    @Test
    void testJsonDeserializationFalse() throws Exception {
        String json = "{\"routed\":false}";

        PublishResponse response = objectMapper.readValue(json, PublishResponse.class);

        assertFalse(response.getRouted());
    }

    @Test
    void testJsonDeserializationNull() throws Exception {
        String json = "{\"routed\":null}";

        PublishResponse response = objectMapper.readValue(json, PublishResponse.class);

        assertNull(response.getRouted());
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"routed\":true," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        PublishResponse response = objectMapper.readValue(json, PublishResponse.class);

        assertTrue(response.getRouted());
    }

    @Test
    void testMessageRoutedSuccessfully() {
        PublishResponse response = new PublishResponse(true);

        assertTrue(response.getRouted());
        // This indicates the message was successfully routed to at least one queue
    }

    @Test
    void testMessageNotRouted() {
        PublishResponse response = new PublishResponse(false);

        assertFalse(response.getRouted());
        // This indicates the message was published but not routed to any queue
        // (e.g., no matching bindings)
    }

    @Test
    void testUnknownRoutingStatus() {
        PublishResponse response = new PublishResponse();

        assertNull(response.getRouted());
        // This might occur if the routing status is unknown or not provided
    }

    @Test
    void testEmptyJsonDeserialization() throws Exception {
        String json = "{}";

        PublishResponse response = objectMapper.readValue(json, PublishResponse.class);

        assertNull(response.getRouted());
    }

    @Test
    void testBooleanValues() {
        PublishResponse response = new PublishResponse();

        // Test true value
        response.setRouted(Boolean.TRUE);
        assertEquals(Boolean.TRUE, response.getRouted());
        assertTrue(response.getRouted());

        // Test false value
        response.setRouted(Boolean.FALSE);
        assertEquals(Boolean.FALSE, response.getRouted());
        assertFalse(response.getRouted());

        // Test null value
        response.setRouted(null);
        assertNull(response.getRouted());
    }
}