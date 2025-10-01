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

class CreateExchangeRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private CreateExchangeRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new CreateExchangeRequest();
        validRequest.setName("test-exchange");
        validRequest.setType("direct");
        validRequest.setVhost("/");
        validRequest.setDurable(true);
        validRequest.setAutoDelete(false);
        validRequest.setInternal(false);
    }

    @Test
    void testDefaultConstructor() {
        CreateExchangeRequest request = new CreateExchangeRequest();

        assertNull(request.getName());
        assertNull(request.getType());
        assertNull(request.getVhost());
        assertTrue(request.getDurable());
        assertFalse(request.getAutoDelete());
        assertFalse(request.getInternal());
        assertNotNull(request.getArguments());
        assertTrue(request.getArguments().isEmpty());
    }

    @Test
    void testConstructorWithParameters() {
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-message-ttl", 60000);

        CreateExchangeRequest request = new CreateExchangeRequest(
                "test-exchange", "topic", "/", true, false, false, arguments);

        assertEquals("test-exchange", request.getName());
        assertEquals("topic", request.getType());
        assertEquals("/", request.getVhost());
        assertTrue(request.getDurable());
        assertFalse(request.getAutoDelete());
        assertFalse(request.getInternal());
        assertEquals(arguments, request.getArguments());
    }

    @Test
    void testValidRequest() {
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid request should have no validation errors");
    }

    @Test
    void testBlankName() {
        validRequest.setName("");
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testNullName() {
        validRequest.setName(null);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testInvalidNamePattern() {
        validRequest.setName("invalid@name");
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testValidNamePatterns() {
        String[] validNames = { "test", "test-exchange", "test_exchange", "test.exchange", "test123" };

        for (String name : validNames) {
            validRequest.setName(name);
            Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Name '" + name + "' should be valid");
        }
    }

    @Test
    void testNameTooLong() {
        String longName = "a".repeat(256);
        validRequest.setName(longName);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testBlankType() {
        validRequest.setType("");
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("type")));
    }

    @Test
    void testNullType() {
        validRequest.setType(null);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("type")));
    }

    @Test
    void testInvalidType() {
        validRequest.setType("invalid");
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("type")));
    }

    @Test
    void testValidTypes() {
        String[] validTypes = { "direct", "fanout", "topic", "headers" };

        for (String type : validTypes) {
            validRequest.setType(type);
            Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
            assertTrue(violations.isEmpty(), "Type '" + type + "' should be valid");
        }
    }

    @Test
    void testBlankVhost() {
        validRequest.setVhost("");
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("vhost")));
    }

    @Test
    void testNullVhost() {
        validRequest.setVhost(null);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("vhost")));
    }

    @Test
    void testNullDurable() {
        validRequest.setDurable(null);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("durable")));
    }

    @Test
    void testNullAutoDelete() {
        validRequest.setAutoDelete(null);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("autoDelete")));
    }

    @Test
    void testNullInternal() {
        validRequest.setInternal(null);
        Set<ConstraintViolation<CreateExchangeRequest>> violations = validator.validate(validRequest);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("internal")));
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

        String json = objectMapper.writeValueAsString(validRequest);

        assertTrue(json.contains("\"name\":\"test-exchange\""));
        assertTrue(json.contains("\"type\":\"direct\""));
        assertTrue(json.contains("\"vhost\":\"/\""));
        assertTrue(json.contains("\"durable\":true"));
        assertTrue(json.contains("\"autoDelete\":false"));
        assertTrue(json.contains("\"internal\":false"));
        assertTrue(json.contains("\"x-message-ttl\":60000"));
    }

    @Test
    void testJsonDeserialization() throws Exception {
        String json = "{" +
                "\"name\":\"test-exchange\"," +
                "\"type\":\"topic\"," +
                "\"vhost\":\"/test\"," +
                "\"durable\":false," +
                "\"autoDelete\":true," +
                "\"internal\":true," +
                "\"arguments\":{\"x-message-ttl\":60000}" +
                "}";

        CreateExchangeRequest request = objectMapper.readValue(json, CreateExchangeRequest.class);

        assertEquals("test-exchange", request.getName());
        assertEquals("topic", request.getType());
        assertEquals("/test", request.getVhost());
        assertFalse(request.getDurable());
        assertTrue(request.getAutoDelete());
        assertTrue(request.getInternal());
        assertEquals(60000, request.getArguments().get("x-message-ttl"));
    }

    @Test
    void testSettersAndGetters() {
        CreateExchangeRequest request = new CreateExchangeRequest();
        Map<String, Object> arguments = new HashMap<>();
        arguments.put("x-alternate-exchange", "alternate");

        request.setName("my-exchange");
        request.setType("fanout");
        request.setVhost("/test");
        request.setDurable(false);
        request.setAutoDelete(true);
        request.setInternal(true);
        request.setArguments(arguments);

        assertEquals("my-exchange", request.getName());
        assertEquals("fanout", request.getType());
        assertEquals("/test", request.getVhost());
        assertFalse(request.getDurable());
        assertTrue(request.getAutoDelete());
        assertTrue(request.getInternal());
        assertEquals(arguments, request.getArguments());
    }
}