package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MessageDtoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDefaultConstructor() {
        MessageDto dto = new MessageDto();

        assertNull(dto.getPayloadEncoding());
        assertNull(dto.getPayload());
        assertNull(dto.getProperties());
        assertNull(dto.getRoutingKey());
        assertNull(dto.getRedelivered());
        assertNull(dto.getExchange());
        assertNull(dto.getMessageCount());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> properties = new HashMap<>();
        properties.put("delivery_mode", 2);
        properties.put("priority", 5);

        MessageDto dto = new MessageDto(
                "string", "Hello World", properties,
                "test.key", false, "test-exchange", 10);

        assertEquals("string", dto.getPayloadEncoding());
        assertEquals("Hello World", dto.getPayload());
        assertEquals(properties, dto.getProperties());
        assertEquals("test.key", dto.getRoutingKey());
        assertFalse(dto.getRedelivered());
        assertEquals("test-exchange", dto.getExchange());
        assertEquals(10, dto.getMessageCount());
    }

    @Test
    void testSettersAndGetters() {
        MessageDto dto = new MessageDto();
        Map<String, Object> properties = new HashMap<>();
        properties.put("content_type", "application/json");
        properties.put("correlation_id", "12345");

        dto.setPayloadEncoding("base64");
        dto.setPayload("SGVsbG8gV29ybGQ=");
        dto.setProperties(properties);
        dto.setRoutingKey("my.routing.key");
        dto.setRedelivered(true);
        dto.setExchange("my-exchange");
        dto.setMessageCount(5);

        assertEquals("base64", dto.getPayloadEncoding());
        assertEquals("SGVsbG8gV29ybGQ=", dto.getPayload());
        assertEquals(properties, dto.getProperties());
        assertEquals("my.routing.key", dto.getRoutingKey());
        assertTrue(dto.getRedelivered());
        assertEquals("my-exchange", dto.getExchange());
        assertEquals(5, dto.getMessageCount());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> properties = new HashMap<>();
        properties.put("delivery_mode", 2);
        properties.put("content_type", "text/plain");

        MessageDto dto = new MessageDto(
                "string", "Test message", properties,
                "test.routing.key", false, "test-exchange", 1);

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(json.contains("\"payload_encoding\":\"string\""));
        assertTrue(json.contains("\"payload\":\"Test message\""));
        assertTrue(json.contains("\"routing_key\":\"test.routing.key\""));
        assertTrue(json.contains("\"redelivered\":false"));
        assertTrue(json.contains("\"exchange\":\"test-exchange\""));
        assertTrue(json.contains("\"message_count\":1"));
        assertTrue(json.contains("\"delivery_mode\":2"));
        assertTrue(json.contains("\"content_type\":\"text/plain\""));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"payload_encoding\":\"base64\"," +
                "\"payload\":\"SGVsbG8=\"," +
                "\"properties\":{\"delivery_mode\":1,\"priority\":3}," +
                "\"routing_key\":\"my.key\"," +
                "\"redelivered\":true," +
                "\"exchange\":\"my-exchange\"," +
                "\"message_count\":15" +
                "}";

        MessageDto dto = objectMapper.readValue(json, MessageDto.class);

        assertEquals("base64", dto.getPayloadEncoding());
        assertEquals("SGVsbG8=", dto.getPayload());
        assertEquals("my.key", dto.getRoutingKey());
        assertTrue(dto.getRedelivered());
        assertEquals("my-exchange", dto.getExchange());
        assertEquals(15, dto.getMessageCount());

        assertNotNull(dto.getProperties());
        assertEquals(1, dto.getProperties().get("delivery_mode"));
        assertEquals(3, dto.getProperties().get("priority"));
    }

    @Test
    void testJsonIgnoreUnknownProperties() throws Exception {
        String json = "{" +
                "\"payload\":\"Test\"," +
                "\"unknown_field\":\"should_be_ignored\"," +
                "\"another_unknown\":123" +
                "}";

        // Should not throw exception due to @JsonIgnoreProperties(ignoreUnknown = true)
        MessageDto dto = objectMapper.readValue(json, MessageDto.class);

        assertEquals("Test", dto.getPayload());
    }

    @Test
    void testNullValues() {
        MessageDto dto = new MessageDto();

        dto.setPayloadEncoding(null);
        dto.setPayload(null);
        dto.setProperties(null);
        dto.setRoutingKey(null);
        dto.setRedelivered(null);
        dto.setExchange(null);
        dto.setMessageCount(null);

        assertNull(dto.getPayloadEncoding());
        assertNull(dto.getPayload());
        assertNull(dto.getProperties());
        assertNull(dto.getRoutingKey());
        assertNull(dto.getRedelivered());
        assertNull(dto.getExchange());
        assertNull(dto.getMessageCount());
    }

    @Test
    void testPayloadEncodings() {
        MessageDto dto = new MessageDto();

        // Test string encoding
        dto.setPayloadEncoding("string");
        dto.setPayload("Hello World");
        assertEquals("string", dto.getPayloadEncoding());
        assertEquals("Hello World", dto.getPayload());

        // Test base64 encoding
        dto.setPayloadEncoding("base64");
        dto.setPayload("SGVsbG8gV29ybGQ=");
        assertEquals("base64", dto.getPayloadEncoding());
        assertEquals("SGVsbG8gV29ybGQ=", dto.getPayload());
    }

    @Test
    void testMessageProperties() {
        MessageDto dto = new MessageDto();
        Map<String, Object> properties = new HashMap<>();

        // Common RabbitMQ message properties
        properties.put("delivery_mode", 2);
        properties.put("priority", 5);
        properties.put("content_type", "application/json");
        properties.put("content_encoding", "utf-8");
        properties.put("correlation_id", "12345");
        properties.put("reply_to", "response.queue");
        properties.put("expiration", "60000");
        properties.put("message_id", "msg-001");
        properties.put("timestamp", 1640995200000L);
        properties.put("type", "order");
        properties.put("user_id", "user123");
        properties.put("app_id", "my-app");

        dto.setProperties(properties);

        assertEquals(2, dto.getProperties().get("delivery_mode"));
        assertEquals(5, dto.getProperties().get("priority"));
        assertEquals("application/json", dto.getProperties().get("content_type"));
        assertEquals("utf-8", dto.getProperties().get("content_encoding"));
        assertEquals("12345", dto.getProperties().get("correlation_id"));
        assertEquals("response.queue", dto.getProperties().get("reply_to"));
        assertEquals("60000", dto.getProperties().get("expiration"));
        assertEquals("msg-001", dto.getProperties().get("message_id"));
        assertEquals(1640995200000L, dto.getProperties().get("timestamp"));
        assertEquals("order", dto.getProperties().get("type"));
        assertEquals("user123", dto.getProperties().get("user_id"));
        assertEquals("my-app", dto.getProperties().get("app_id"));
    }

    @Test
    void testRedeliveredFlag() {
        MessageDto dto = new MessageDto();

        // Test first delivery
        dto.setRedelivered(false);
        assertFalse(dto.getRedelivered());

        // Test redelivered message
        dto.setRedelivered(true);
        assertTrue(dto.getRedelivered());
    }

    @Test
    void testEmptyProperties() {
        MessageDto dto = new MessageDto();
        Map<String, Object> emptyProps = new HashMap<>();
        dto.setProperties(emptyProps);

        assertNotNull(dto.getProperties());
        assertTrue(dto.getProperties().isEmpty());
    }

    @Test
    void testComplexPayload() {
        MessageDto dto = new MessageDto();

        // Test JSON payload
        String jsonPayload = "{\"id\":123,\"name\":\"test\",\"active\":true}";
        dto.setPayload(jsonPayload);
        dto.setPayloadEncoding("string");

        assertEquals(jsonPayload, dto.getPayload());
        assertEquals("string", dto.getPayloadEncoding());

        // Test binary payload (base64 encoded)
        String binaryPayload = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
        dto.setPayload(binaryPayload);
        dto.setPayloadEncoding("base64");

        assertEquals(binaryPayload, dto.getPayload());
        assertEquals("base64", dto.getPayloadEncoding());
    }
}