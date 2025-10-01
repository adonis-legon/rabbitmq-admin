package com.rabbitmq.admin.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PublishMessageRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private PublishMessageRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new PublishMessageRequest();
        validRequest.setRoutingKey("test.key");
        validRequest.setPayload("Hello, World!");
        validRequest.setPayloadEncoding("string");
    }

    @Test
    void testDefaultConstructor() {
        PublishMessageRequest request = new PublishMessageRequest();

        assertEquals("", request.getRoutingKey());
        assertNotNull(request.getProperties());
        assertTrue(request.getProperties().isEmpty());
        assertNull(request.getPayload());
        assertEquals("string", request.getPayloadEncoding());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> properties = new HashMap<>();
        properties.put("delivery_mode", 2);

        PublishMessageRequest request = new PublishMessageRequest(
                "test.key", properties, "Hello", "string");

        assertEquals("test.key", request.getRoutingKey());
        assertEquals(properties, request.getProperties());
        assertEquals("Hello", request.getPayload());
        assertEquals("string", request.getPayloadEncoding());
    }

    @Test
    void testValidRequest() {
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid request should have no validation errors");
    }

    @Test
    void testNullPayload() {
        validRequest.setPayload(null);
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("payload")));
    }

    @Test
    void testEmptyPayload() {
        validRequest.setPayload("");
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Empty payload should be valid");
    }

    @Test
    void testPayloadTooLarge() {
        String largePayload = "a".repeat(1048577); // 1MB + 1 byte
        validRequest.setPayload(largePayload);
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("payload")));
    }

    @Test
    void testMaxPayloadSize() {
        String maxPayload = "a".repeat(1048576); // Exactly 1MB
        validRequest.setPayload(maxPayload);
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "1MB payload should be valid");
    }

    @Test
    void testRoutingKeyTooLong() {
        String longKey = "a".repeat(256);
        validRequest.setRoutingKey(longKey);
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("routingKey")));
    }

    @Test
    void testNullRoutingKey() {
        validRequest.setRoutingKey(null);
        assertEquals("", validRequest.getRoutingKey());
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null routing key should be converted to empty string");
    }

    @Test
    void testInvalidPayloadEncoding() {
        validRequest.setPayloadEncoding("invalid");
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("payloadEncoding")));
    }

    @Test
    void testValidPayloadEncodings() {
        String[] validEncodings = { "string", "base64" };

        for (String encoding : validEncodings) {
            validRequest.setPayloadEncoding(encoding);
            Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Encoding '" + encoding + "' should be valid");
        }
    }

    @Test
    void testNullPayloadEncoding() {
        validRequest.setPayloadEncoding(null);
        assertEquals("string", validRequest.getPayloadEncoding());
        Set<ConstraintViolation<PublishMessageRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Null encoding should default to 'string'");
    }

    @Test
    void testPropertiesHandling() {
        // Test null properties
        validRequest.setProperties(null);
        assertNotNull(validRequest.getProperties());
        assertTrue(validRequest.getProperties().isEmpty());

        // Test with properties
        Map<String, Object> properties = new HashMap<>();
        properties.put("delivery_mode", 2);
        properties.put("priority", 5);
        properties.put("content_type", "application/json");
        validRequest.setProperties(properties);
        assertEquals(properties, validRequest.getProperties());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> properties = new HashMap<>();
        properties.put("delivery_mode", 2);
        properties.put("content_type", "text/plain");
        validRequest.setProperties(properties);

        String json = objectMapper.writeValueAsString(validRequest);

        assertTrue(json.contains("\"routingKey\":\"test.key\""));
        assertTrue(json.contains("\"payload\":\"Hello, World!\""));
        assertTrue(json.contains("\"payloadEncoding\":\"string\""));
        assertTrue(json.contains("\"delivery_mode\":2"));
        assertTrue(json.contains("\"content_type\":\"text/plain\""));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"routingKey\":\"my.key\"," +
                "\"properties\":{\"delivery_mode\":1,\"priority\":3}," +
                "\"payload\":\"Test message\"," +
                "\"payloadEncoding\":\"base64\"" +
                "}";

        PublishMessageRequest request = objectMapper.readValue(json, PublishMessageRequest.class);

        assertEquals("my.key", request.getRoutingKey());
        assertEquals("Test message", request.getPayload());
        assertEquals("base64", request.getPayloadEncoding());
        assertEquals(1, request.getProperties().get("delivery_mode"));
        assertEquals(3, request.getProperties().get("priority"));
    }

    @Test
    void testSettersAndGetters() {
        PublishMessageRequest request = new PublishMessageRequest();
        Map<String, Object> properties = new HashMap<>();
        properties.put("content_encoding", "gzip");

        request.setRoutingKey("my.routing.key");
        request.setProperties(properties);
        request.setPayload("My message");
        request.setPayloadEncoding("base64");

        assertEquals("my.routing.key", request.getRoutingKey());
        assertEquals(properties, request.getProperties());
        assertEquals("My message", request.getPayload());
        assertEquals("base64", request.getPayloadEncoding());
    }

    @Test
    void testMessageProperties() {
        PublishMessageRequest request = new PublishMessageRequest();
        Map<String, Object> properties = new HashMap<>();

        // Common RabbitMQ message properties
        properties.put("delivery_mode", 2); // persistent
        properties.put("priority", 5);
        properties.put("content_type", "application/json");
        properties.put("content_encoding", "utf-8");
        properties.put("correlation_id", "12345");
        properties.put("reply_to", "response.queue");
        properties.put("expiration", "60000");
        properties.put("message_id", "msg-001");
        properties.put("timestamp", System.currentTimeMillis());
        properties.put("type", "order");
        properties.put("user_id", "user123");
        properties.put("app_id", "my-app");

        request.setProperties(properties);

        assertEquals(2, request.getProperties().get("delivery_mode"));
        assertEquals(5, request.getProperties().get("priority"));
        assertEquals("application/json", request.getProperties().get("content_type"));
        assertEquals("utf-8", request.getProperties().get("content_encoding"));
        assertEquals("12345", request.getProperties().get("correlation_id"));
        assertEquals("response.queue", request.getProperties().get("reply_to"));
        assertEquals("60000", request.getProperties().get("expiration"));
        assertEquals("msg-001", request.getProperties().get("message_id"));
        assertEquals("order", request.getProperties().get("type"));
        assertEquals("user123", request.getProperties().get("user_id"));
        assertEquals("my-app", request.getProperties().get("app_id"));
    }
}