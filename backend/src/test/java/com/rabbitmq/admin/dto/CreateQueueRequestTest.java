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

class CreateQueueRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private CreateQueueRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new CreateQueueRequest();
        validRequest.setName("test-queue");
        validRequest.setVhost("/");
        validRequest.setDurable(true);
        validRequest.setAutoDelete(false);
        validRequest.setExclusive(false);
    }

    @Test
    void testDefaultConstructor() {
        CreateQueueRequest request = new CreateQueueRequest();

        assertNull(request.getName());
        assertNull(request.getVhost());
        assertTrue(request.getDurable());
        assertFalse(request.getAutoDelete());
        assertFalse(request.getExclusive());
        assertNotNull(request.getArguments());
        assertTrue(request.getArguments().isEmpty());
        assertNull(request.getNode());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);

        CreateQueueRequest request = new CreateQueueRequest(
                "test-queue", "/", true, false, false, arguments, "rabbit@node1");

        assertEquals("test-queue", request.getName());
        assertEquals("/", request.getVhost());
        assertTrue(request.getDurable());
        assertFalse(request.getAutoDelete());
        assertFalse(request.getExclusive());
        assertEquals(arguments, request.getArguments());
        assertEquals("rabbit@node1", request.getNode());
    }

    @Test
    void testValidRequest() {
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid request should have no validation errors");
    }

    @Test
    void testBlankName() {
        validRequest.setName("");
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testNullName() {
        validRequest.setName(null);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testInvalidNamePattern() {
        validRequest.setName("invalid@name");
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testValidNamePatterns() {
        String[] validNames = { "test", "test-queue", "test_queue", "test.queue", "test123" };

        for (String name : validNames) {
            validRequest.setName(name);
            Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Name '" + name + "' should be valid");
        }
    }

    @Test
    void testNameTooLong() {
        String longName = "a".repeat(256);
        validRequest.setName(longName);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testBlankVhost() {
        validRequest.setVhost("");
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("vhost")));
    }

    @Test
    void testNullVhost() {
        validRequest.setVhost(null);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("vhost")));
    }

    @Test
    void testNullDurable() {
        validRequest.setDurable(null);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("durable")));
    }

    @Test
    void testNullAutoDelete() {
        validRequest.setAutoDelete(null);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("autoDelete")));
    }

    @Test
    void testNullExclusive() {
        validRequest.setExclusive(null);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("exclusive")));
    }

    @Test
    void testNodeTooLong() {
        String longNode = "a".repeat(256);
        validRequest.setNode(longNode);
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("node")));
    }

    @Test
    void testValidNode() {
        validRequest.setNode("rabbit@node1");
        Set<ConstraintViolation<CreateQueueRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid node should pass validation");
    }

    @Test
    void testArgumentsHandling() {
        // Test null arguments
        validRequest.setArguments(null);
        assertNotNull(validRequest.getArguments());
        assertTrue(validRequest.getArguments().isEmpty());

        // Test with arguments
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);
        arguments.put("x-max-length", 1000);
        validRequest.setArguments(arguments);
        assertEquals(arguments, validRequest.getArguments());
    }

    @Test
    void testJsonSerialization() throws Exception {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);
        validRequest.setArguments(arguments);
        validRequest.setNode("rabbit@node1");

        String json = objectMapper.writeValueAsString(validRequest);

        assertTrue(json.contains("\"name\":\"test-queue\""));
        assertTrue(json.contains("\"vhost\":\"/\""));
        assertTrue(json.contains("\"durable\":true"));
        assertTrue(json.contains("\"autoDelete\":false"));
        assertTrue(json.contains("\"exclusive\":false"));
        assertTrue(json.contains("\"node\":\"rabbit@node1\""));
        assertTrue(json.contains("\"x-message-ttl\":60000"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"test-queue\"," +
                "\"vhost\":\"/test\"," +
                "\"durable\":false," +
                "\"autoDelete\":true," +
                "\"exclusive\":true," +
                "\"arguments\":{\"x-message-ttl\":60000}," +
                "\"node\":\"rabbit@node1\"" +
                "}";

        CreateQueueRequest request = objectMapper.readValue(json, CreateQueueRequest.class);

        assertEquals("test-queue", request.getName());
        assertEquals("/test", request.getVhost());
        assertFalse(request.getDurable());
        assertTrue(request.getAutoDelete());
        assertTrue(request.getExclusive());
        assertEquals(60000, request.getArguments().get("x-message-ttl"));
        assertEquals("rabbit@node1", request.getNode());
    }

    @Test
    void testSettersAndGetters() {
        CreateQueueRequest request = new CreateQueueRequest();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-max-length", 1000);

        request.setName("my-queue");
        request.setVhost("/test");
        request.setDurable(false);
        request.setAutoDelete(true);
        request.setExclusive(true);
        request.setArguments(arguments);
        request.setNode("rabbit@node2");

        assertEquals("my-queue", request.getName());
        assertEquals("/test", request.getVhost());
        assertFalse(request.getDurable());
        assertTrue(request.getAutoDelete());
        assertTrue(request.getExclusive());
        assertEquals(arguments, request.getArguments());
        assertEquals("rabbit@node2", request.getNode());
    }
}